import express from "express";
import bodyParser from "body-parser";
import { ZBClient } from "zeebe-node";

const callbacks = new Map();
const cachedOutcomes = new Map();

const zb = new ZBClient("localhost");

/** Main */
deployWorkflow()
  .then(startOutcomeWorker)
  .then(startRESTServer);

/** REST Server */
async function startRESTServer() {
  const app = express();
  const port = 3000;

  app.use(bodyParser.json());
  app.post("/api/purchase", purchaseRouteHandler);
  app.get("/api/callback/:workflowInstanceKey", outcomeCallbackOnce);
  app.use(express.static("public"));
  app.listen(port, () =>
    console.log(`\nZeebe Storefront REST API listening on port ${port}`)
  );
}

async function purchaseRouteHandler(
  req: express.Request,
  res: express.Response
) {
  /**
   * The client times the request out in 10 seconds. We will respond with a callback url
   * if we don't get a workflow outcome in 9 seconds.
   */
  const REQUEST_TIMEOUT = 9000;
  const { product, creditcard, name } = req.body;
  console.log(`Order for ${name}: ${product} with payment: ${creditcard}`);
  let wfi;
  try {
    wfi = await zb.createWorkflowInstance("order-fulfilment", {
      product,
      creditcard,
      name
    });
  } catch (e) {
    // If the broker has been restarted, redeploy
    await deployWorkflow();
    wfi = await zb.createWorkflowInstance("order-fulfilment", {
      product,
      creditcard,
      name
    });
  }

  const { workflowInstanceKey } = wfi;

  /**
   * This callback closes the request with the workflow outcome if it arrives in time
   */
  callbacks.set(workflowInstanceKey, outcome => {
    clearTimeout(sendCallbackUrl);
    res.json(outcome);
  });

  /**
   * If the workflow does not complete in time, send back a callback url that the client can poll
   */
  const sendCallbackUrl = setTimeout(() => {
    callbacks.delete(workflowInstanceKey);
    console.log(`Workflow timed out for ${name}. Sending async callback URL`);
    res.json({
      callback: `/api/callback/${workflowInstanceKey}`
    });
  }, REQUEST_TIMEOUT);
}

/**
 * Callback route handler to allow clients to poll for a long-running workflow outcome.
 * Returns the workflow outcome if it is available, 404 if not.
 */
function outcomeCallbackOnce(req, res) {
  const { workflowInstanceKey } = req.params;
  if (cachedOutcomes.has(workflowInstanceKey)) {
    res.json(cachedOutcomes.get(workflowInstanceKey));
    cachedOutcomes.delete(workflowInstanceKey);
    return;
  } else {
    return res.status(404).send();
  }
}

/** Deploy Workflow to Zeebe when REST Server starts */
async function deployWorkflow() {
  const wf = await zb.deployWorkflow("./bpmn/purchase.bpmn");
  console.log("\nDeployed Workflow:");
  console.log(wf);
}

/** ZB Outcome Worker */
async function startOutcomeWorker() {
  zb.createWorker(
    "outcome-worker",
    "publish-outcome",
    (job, complete) => {
      const { workflowInstanceKey, variables } = job;
      const { operation_success, outcome_message } = variables;

      /**
       * Put this in a try-finally block to ensure the job completes even if the response callback
       * fails (due to closed connection, etc...)
       * */
      try {
        const isRestRequestStillAlive = callbacks.has(workflowInstanceKey);
        if (isRestRequestStillAlive) {
          callbacks.get(workflowInstanceKey)({
            operation_success,
            outcome_message
          });
        } else {
          cachedOutcomes.set(workflowInstanceKey, {
            operation_success,
            outcome_message
          });
        }
      } finally {
        callbacks.delete(workflowInstanceKey);
        complete.success();
      }
    },
    { loglevel: "ERROR", pollInterval: 100 }
  );
}

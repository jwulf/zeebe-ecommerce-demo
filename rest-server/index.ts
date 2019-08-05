import express from "express";
import bodyParser from "body-parser";
import { ZBClient } from "zeebe-node";

const REST_TIMEOUT = 9000;
const app = express();
const port = 3000;
const callbacks = new Map();
const cachedOutcomes = new Map();
const zb = new ZBClient("localhost");

/** REST Server */
app.use(bodyParser.json()); // support json encoded bodies

app.post("/api/purchase", purchaseRouteHandler);
app.get("/api/callback/:workflowInstanceKey", outcomeCallbackOnce);
app.use(express.static("public"));

app.listen(port, () =>
  console.log(`\nZeebe Storefront REST API listening on port ${port}`)
);

async function purchaseRouteHandler(
  req: express.Request,
  res: express.Response
) {
  const { product, creditcard, name } = req.body;
  console.log(`Order for ${name}: ${product} with payment: ${creditcard}`);

  const wfi = await zb.createWorkflowInstance("order-fulfilment", {
    product,
    creditcard,
    name
  });

  const { workflowInstanceKey } = wfi;

  callbacks.set(workflowInstanceKey, outcome => {
    clearTimeout(sendCallbackUrl);
    res.json(outcome);
  });

  // Avoid client timeout when workflow is stalled
  // by sending a callback url that the client can poll
  const sendCallbackUrl = setTimeout(() => {
    callbacks.delete(workflowInstanceKey);
    console.log(`Workflow timed out for ${name}. Sending async callback URL`);
    res.json({
      callback: `/api/callback/${workflowInstanceKey}`
    });
  }, REST_TIMEOUT);
}

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

/** Deploy Workflow */
async function deployWorkflow() {
  const wf = await zb.deployWorkflow("./bpmn/purchase.bpmn");
  console.log("\nDeployed Workflow:");
  console.log(wf);
}

deployWorkflow().then(startOutcomeWorker);

/** ZB Outcome Worker */
function startOutcomeWorker() {
  zb.createWorker("outcome-worker", "publish-outcome", (job, complete) => {
    const { workflowInstanceKey, variables } = job;
    const { operation_success, outcome_message } = variables;
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
  });
}

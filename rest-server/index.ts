import express from "express";
import bodyParser from "body-parser";
import { ZBClient } from "zeebe-node";
import { v4 as uuid } from "uuid";
import brokerConfig from "../zeebe-broker-connection";

// A Map of Functions to return a REST Response
const callbacks = new Map();
const cachedOutcomes = new Map();
const futureMap = new Map();

let deployed = false;
let deploying: Promise<any> | undefined = undefined;

/** Main */

const conf = {
  loglevel: "DEBUG" as "NONE",
  longPoll: 10000,
  ...brokerConfig
};

console.log(conf);
const zb = new ZBClient(conf);

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
  app.get("/api/callback/future/:future", futureOutcomeCallbackOnce);
  app.use(express.static("public"));
  app.listen(port, () =>
    console.log(`\nZeebe Storefront REST API listening on port ${port}`)
  );
}

async function purchaseRouteHandler(
  req: express.Request,
  res: express.Response
) {
  let wfi;
  let future;

  /**
   * The client times the request out in 10 seconds. We will respond with a callback url
   * if we don't get a workflow outcome in 9 seconds.
   */
  const REQUEST_TIMEOUT = 9000;
  /**
   * If the workflow does not start or complete in time, send back a callback url that the client can poll
   */
  const sendCallbackUrl = setTimeout(() => {
    let callbackRoute;
    if (wfi) {
      // If we have a workflow instance key, we started a workflow, but didn't get it in time
      callbacks.delete(workflowInstanceKey);
      callbackRoute = workflowInstanceKey;
    } else {
      // We didn't even start a workflow yet!
      future = uuid();
      callbackRoute = `future/${future}`;
    }
    console.log(`Workflow timed out for ${name}. Sending async callback URL`);
    res.json({
      callback: `/api/callback/${callbackRoute}`
    });
  }, REQUEST_TIMEOUT);

  const { product, creditcard, name } = req.body;
  console.log(`Order for ${name}: ${product} with payment: ${creditcard}`);
  await deploying;

  try {
    wfi = await zb.createWorkflowInstance(
      "order-fulfilment",
      {
        product,
        creditcard,
        name
      },
      {
        retry: false
      }
    );
  } catch (e) {
    // If the broker has been restarted, redeploy
    // Note this can also happen due to overload. See: https://github.com/zeebe-io/zeebe/issues/2989
    if (!deploying) {
      console.log("Redeploying...");
      deploying = deployWorkflow();
    }
    await deploying;
    wfi = await zb.createWorkflowInstance("order-fulfilment", {
      product,
      creditcard,
      name
    });
  }

  const { workflowInstanceKey } = wfi;
  // If the future has been created, it means that we already returned a response
  if (future) {
    futureMap.set(future, workflowInstanceKey);
  } else {
    /**
     * This callback closes the request with the workflow outcome if it arrives in time
     */
    callbacks.set(workflowInstanceKey, outcome => {
      clearTimeout(sendCallbackUrl);
      res.json(outcome);
    });
  }
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

/**
 * Callback route handler to allow clients to poll for a workflows that didn't even start in time.
 * Returns the workflow outcome if it is available, 404 if not.
 */
function futureOutcomeCallbackOnce(req, res) {
  const { future } = req.params;
  if (futureMap.has(future)) {
    const workflowInstanceKey = futureMap.get(future);
    if (cachedOutcomes.has(workflowInstanceKey)) {
      res.json(cachedOutcomes.get(workflowInstanceKey));
      cachedOutcomes.delete(workflowInstanceKey);
      futureMap.delete(future);
      return;
    }
  }
  return res.status(404).send();
}

/** Deploy Workflow to Zeebe when REST Server starts */
async function deployWorkflow(broker?) {
  return zb.deployWorkflow("./bpmn/purchase.bpmn").then(wf => {
    console.log("\nDeployed Workflow:");
    console.log(wf);
    deploying = undefined;
    return Promise.resolve(broker);
  });
}

/** ZB Outcome Worker */
async function startOutcomeWorker(broker) {
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
    {
      loglevel: "NONE",
      timeout: 10000,
      longPoll: 120000
    }
  );
}

setInterval(
  () =>
    console.log(`Memory usage: ${process.memoryUsage().rss / 1024 / 1024}MB`),
  120000
);

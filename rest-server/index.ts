import express from "express";
import bodyParser from "body-parser";
import { ZBClient, Duration } from "zeebe-node";
import { v4 as uuid } from "uuid";
import { queue } from "async";
import { MAX_PARALLEL_WORKFLOWS } from "./config";
// A Map of Functions to return a REST Response
const cachedOutcomes = {};
const futureMap = {};

let deploying: Promise<any> | undefined = undefined;

/** Main */

const zb = new ZBClient();

deployWorkflow()
  .then(startOutcomeWorker)
  .then(startRESTServer);

/** REST Server */
async function startRESTServer() {
  const app = express();
  const port = 3000;

  app.use(bodyParser.json());
  app.get("/api/parallelism", (_, res) => {
    res.json({ parallelism: MAX_PARALLEL_WORKFLOWS });
  });
  app.post("/api/purchase", purchaseRouteHandler);
  app.get("/api/callback/future/:future", futureOutcomeCallbackOnce);
  app.use(express.static("public"));
  app.listen(port, () =>
    console.log(`\nZeebe Storefront REST API listening on port ${port}`)
  );
}

const q = queue((task, next) => {
  (task as any)(next);
}, MAX_PARALLEL_WORKFLOWS);

async function purchaseRouteHandler(
  req: express.Request,
  res: express.Response
) {
  let wfi;
  const future = uuid();
  let workflowInstanceKey;

  const { product, creditcard, name } = req.body;

  const callbackRoute = `future/${future}`;

  /**
   * Send back a callback url that the client can poll
   */
  console.log(`Sending async callback URL for ${name}`);
  res.json({
    callback: `/api/callback/${callbackRoute}`
  });

  const task = async next => {
    console.log(`Order for ${name}: ${product} with payment: ${creditcard}`);
    await deploying;

    try {
      wfi = await zb.createWorkflowInstance("order-fulfilment", {
        product,
        creditcard,
        name,
        future
      });
    } catch (e) {
      // If the broker has been restarted, redeploy
      await deploying;
      wfi = await zb.createWorkflowInstance("order-fulfilment", {
        product,
        creditcard,
        name,
        future
      });
    }

    workflowInstanceKey = wfi.workflowInstanceKey;
    futureMap[future] = { workflowInstanceKey, next };
  };
  q.push(task, () => console.log(`Workflow for ${name} complete`));
}

/**
 * Callback route handler to allow clients to poll for a workflows that didn't even start in time.
 * Returns the workflow outcome if it is available, 404 if not.
 */
function futureOutcomeCallbackOnce(req, res) {
  const { future } = req.params;
  if (futureMap[future]) {
    const { workflowInstanceKey } = futureMap[future];
    if (cachedOutcomes[workflowInstanceKey]) {
      res.json(cachedOutcomes[workflowInstanceKey]);
      delete cachedOutcomes[workflowInstanceKey];
      delete futureMap[future];
      return;
    }
  }
  return res.status(404).send();
}

/** Deploy Workflow to Zeebe when REST Server starts */
async function deployWorkflow(broker?) {
  deploying =
    deploying ||
    zb.deployWorkflow("./bpmn/purchase.bpmn").then(wf => {
      console.log("\nDeployed Workflow:");
      console.log(wf);
      deploying = undefined;
      return Promise.resolve(broker);
    });
  return deploying;
}

/** ZB Outcome Worker */
async function startOutcomeWorker() {
  zb.createWorker({
    taskType: "publish-outcome",
    taskHandler: (job, complete) => {
      const { workflowInstanceKey, variables } = job;
      const { operation_success, outcome_message } = variables;
      try {
        const future = variables.future;
        const { next } = futureMap[future];
        cachedOutcomes[workflowInstanceKey] = {
          operation_success,
          outcome_message
        };
        next();
      } catch (e) {
        console.log(e);
        console.log({ workflowInstanceKey });
      } finally {
        complete.success();
      }
    },
    loglevel: "NONE",
    timeout: Duration.seconds.of(30),
    longPoll: Duration.seconds.of(60)
  });
}

setInterval(
  () =>
    console.log(`Memory usage: ${process.memoryUsage().rss / 1024 / 1024}MB`),
  120000
);

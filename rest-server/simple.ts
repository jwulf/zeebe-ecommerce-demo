import express from "express";
import bodyParser from "body-parser";
import { ZBClient } from "zeebe-node";

const zb = new ZBClient("localhost", {
  loglevel: "NONE"
});

const callbacks = new Map();

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
  app.use(express.static("public"));
  app.listen(port, () =>
    console.log(`\nZeebe Storefront REST API listening on port ${port}`)
  );
}

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

  callbacks.set(wfi.workflowInstanceKey, outcome => res.json(outcome));
}

/** Deploy Workflow to Zeebe when REST Server starts */
async function deployWorkflow() {
  return zb.deployWorkflow("./bpmn/purchase.bpmn").then(wf => {
    console.log("\nDeployed Workflow:");
    console.log(wf);
  });
}

/** ZB Outcome Worker */
async function startOutcomeWorker() {
  zb.createWorker(
    "outcome-worker",
    "publish-outcome",
    (job, complete) => {
      const { workflowInstanceKey, variables } = job;
      const { operation_success, outcome_message } = variables;

      callbacks.get(workflowInstanceKey)({
        operation_success,
        outcome_message
      });

      callbacks.delete(workflowInstanceKey);
      complete.success();
    },
    { loglevel: "NONE", pollInterval: 100 }
  );
}

setInterval(
  () =>
    console.log(`Memory usage: ${process.memoryUsage().rss / 1024 / 1024}MB`),
  10000
);

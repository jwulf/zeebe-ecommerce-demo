import express from "express";
import bodyParser from "body-parser";
import { ZBClient } from "zeebe-node";

const app = express();
const port = 3000;
const callbacks: any = {};
const zb = new ZBClient("localhost");

/** REST Server */
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.post("/api/purchase", purchaseRouteHandler);
app.use(express.static("public"));

app.listen(port, () =>
  console.log(`\nZeebe Storefront REST API listening on port ${port}`)
);

async function purchaseRouteHandler(req, res) {
  const { product, creditcard, name } = req.body;
  console.log(`Order for ${name}: ${product} with payment: ${creditcard}`);

  const wfi = await zb.createWorkflowInstance("purchase-process", {
    product,
    creditcard,
    name
  });

  callbacks[wfi.workflowInstanceKey] = outcome => {
    res.json(outcome);
  };
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
  zb.createWorker("worker1", "publish-outcome", (job, complete) => {
    const { workflowInstanceKey, variables } = job;
    const { operation_success, outcome_message } = variables;
    callbacks[workflowInstanceKey]({
      operation_success,
      outcome_message
    });
    complete.success();
  });
}

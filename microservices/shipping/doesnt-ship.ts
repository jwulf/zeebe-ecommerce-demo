import { ZBClient } from "zeebe-node";
import { printMemoryUsage } from "../lib/memory";
import { WorkflowVariables, WorkflowCustomHeaders } from "../interfaces";
import brokerConfig from "../../zeebe-broker-connection";

async function main() {
  const zb = new ZBClient({
    longPoll: 10000,
    ...brokerConfig
  });
  zb.createWorker<WorkflowVariables, WorkflowCustomHeaders, WorkflowVariables>(
    "shipping-failure",
    "ship-items",
    (job, complete) => {
      const operation_success = false;
      const { variables } = job;
      const { product, name } = variables;
      const outcome_message = `${product} purchased by ${name}, but did not ship!`;
      console.log(outcome_message);
      complete.success({ operation_success, outcome_message });
    },
    { maxJobsToActivate: 10 }
  );
}

main();

printMemoryUsage();

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
    "shipping-worker",
    "ship-items",
    (job, complete) => {
      const operation_success = true;
      const { variables } = job;
      const { product, name } = variables;
      console.log(`Calling shipping API for ${name}...`);
      /** Emulate a 2 second delay calling a third-party shipping API like Temando */
      setTimeout(() => {
        const outcome_message = `Shipped ${product} to ${name}`;
        console.log(outcome_message);
        complete.success({ operation_success, outcome_message });
      }, 200);
    },
    {
      timeout: 10000,
      maxJobsToActivate: 64,
      pollInterval: 10000,
      longPoll: 10000
    }
  );
}

main();

printMemoryUsage();

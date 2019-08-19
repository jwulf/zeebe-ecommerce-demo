import { ZBClient } from "zeebe-node";
import { printMemoryUsage } from "../lib/memory";

const zb = new ZBClient("localhost", {
  longPoll: 300000
});

async function main() {
  zb.createWorker(
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
      }, 2000);
    },
    {
      timeout: 30000,
      maxJobsToActivate: 128,
      pollInterval: 1000
    }
  );
}

main();

printMemoryUsage();

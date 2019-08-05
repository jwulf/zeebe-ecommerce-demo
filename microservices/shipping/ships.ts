import { ZBClient } from "zeebe-node";

const zb = new ZBClient("localhost");

async function main() {
  zb.createWorker(
    "shipping-worker",
    "ship-items",
    (job, complete) => {
      const operation_success = true;
      const { variables } = job;
      const { product, name } = variables;
      console.log(`Calling shipping API for ${name}...`);
      setTimeout(() => {
        const outcome_message = `Shipped ${product} to ${name}`;
        console.log(outcome_message);
        complete.success({ operation_success, outcome_message });
      }, 2000);
    },
    {
      timeout: 30000
    }
  );
}

main();

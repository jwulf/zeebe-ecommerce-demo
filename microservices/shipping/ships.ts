import { ZBClient } from "zeebe-node";

const zb = new ZBClient("localhost");

async function main() {
  zb.createWorker("payment-worker", "ship-items", (job, complete) => {
    const operation_success = true;
    const { variables } = job;
    const { product, name } = variables;
    const outcome_message = `Shipped ${product} to ${name}`;
    console.log(outcome_message);
    complete.success({ operation_success, outcome_message });
  });
}

main();

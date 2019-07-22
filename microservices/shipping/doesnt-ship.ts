import { ZBClient } from "zeebe-node";

const zb = new ZBClient("localhost");

async function main() {
  zb.createWorker("shipping-failure", "ship-items", (job, complete) => {
    const operation_success = false;
    const { variables } = job;
    const { product, name } = variables;
    const outcome_message = `${product} purchased by ${name}, but did not ship!`;
    console.log(outcome_message);
    complete.success({ operation_success, outcome_message });
  });
}

main();

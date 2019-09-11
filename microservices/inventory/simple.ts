import { ZBClient } from "zeebe-node";
import { Product } from "../interfaces";

const zb = new ZBClient("localhost", {
  longPoll: 10000
});

let stock = 10000;

async function main() {
  console.log(`Current stock level of Zeebe OSC packs: ${stock}`);

  zb.createWorker(
    "inventory-worker-1",
    "check-inventory",
    (job, complete) => {
      const { variables } = job;
      const { product, name } = variables;
      const operation_success = product == Product.ZEEBE_OSC_PACK && stock > 0;
      const outcome_message = operation_success
        ? `${product} in stock for ${name}`
        : `${product} not in stock for ${name}!`;
      console.log(outcome_message);
      complete.success({ operation_success, outcome_message });
    },
    { loglevel: "INFO", maxJobsToActivate: 128, pollInterval: 1000 }
  );

  zb.createWorker(
    "inventory-worker-2",
    "decrement-stock",
    (job, complete) => {
      const { variables } = job;
      const { product } = variables;
      stock--;
      const outcome_message = `Decremented stock for ${product}. Current stock: ${stock}`;
      console.log(outcome_message);
      complete.success();
    },
    { pollInterval: 1000 }
  );
}

main();

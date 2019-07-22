import { ZBClient } from "zeebe-node";
import { Product } from "../interfaces";

const zb = new ZBClient("localhost");

let stock = 10;

async function main() {
  zb.createWorker("inventory-worker", "check-inventory", (job, complete) => {
    const { variables } = job;
    const { product } = variables;
    const operation_success = product == Product.ZEEBE_OSC_PACK && stock > 0;
    const outcome_message = operation_success
      ? "Product in stock"
      : "Product not in stock!";
    complete.success({ operation_success, outcome_message });
  });

  zb.createWorker("inventory-worker", "decrement-stock", (job, complete) => {
    const { variables } = job;
    const { product } = variables;
    stock--;
    const outcome_message = `Decremented stock for ${product}. Current stock: ${stock}`;
    console.log(outcome_message);
    complete.success({ operation_success: true, outcome_message });
  });
}

main();

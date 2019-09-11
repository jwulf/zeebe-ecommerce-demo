import { ZBClient } from "zeebe-node";

import {
  Product,
  WorkflowVariables,
  WorkflowCustomHeaders
} from "../interfaces";
import { printMemoryUsage } from "../lib/memory";
import brokerConfig from "../../zeebe-broker-connection";

let stock = 10000;

async function main() {
  const zb = new ZBClient({
    longPoll: 10000,
    ...brokerConfig
  });

  console.log(`Current stock level of Zeebe OSC packs: ${stock}`);

  zb.createWorker<WorkflowVariables, WorkflowCustomHeaders, WorkflowVariables>(
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
    {
      loglevel: "INFO",
      maxJobsToActivate: 10,
      timeout: 10000,
      longPoll: 10000
    }
  );

  zb.createWorker<WorkflowVariables>(
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
    { timeout: 10000, longPoll: 10000, maxJobsToActivate: 10 }
  );
}

main();

printMemoryUsage();

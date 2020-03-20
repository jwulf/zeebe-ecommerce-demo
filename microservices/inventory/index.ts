import { ZBClient, Duration } from "zeebe-node";

import {
  Product,
  WorkflowVariables,
  WorkflowCustomHeaders
} from "../interfaces";
import { printMemoryUsage } from "../lib/memory";

let stock = 10000;

async function main() {
  const zb = new ZBClient();

  console.log(`Current stock level of Zeebe OSC packs: ${stock}`);

  zb.createWorker<WorkflowVariables, WorkflowCustomHeaders, WorkflowVariables>({
    taskType: "check-inventory",
    taskHandler: (job, complete) => {
      const { variables } = job;
      const { product, name } = variables;
      const operation_success = product == Product.ZEEBE_OSC_PACK && stock > 0;
      const outcome_message = operation_success
        ? `${product} in stock for ${name}`
        : `${product} not in stock for ${name}!`;
      console.log(outcome_message);
      complete.success({ operation_success, outcome_message });
    },

    loglevel: "INFO",
    maxJobsToActivate: 10,
    timeout: Duration.seconds.of(30),
    longPoll: Duration.seconds.of(60)
  });

  zb.createWorker<WorkflowVariables>({
    taskType: "decrement-stock",
    taskHandler: (job, complete) => {
      const { variables } = job;
      const { product } = variables;
      stock--;
      const outcome_message = `Decremented stock for ${product}. Current stock: ${stock}`;
      console.log(outcome_message);
      complete.success();
    },
    timeout: Duration.seconds.of(30),
    longPoll: Duration.seconds.of(60),
    maxJobsToActivate: 10
  });
}

main();

printMemoryUsage();

import { ZBClient } from "zeebe-node";

const zb = new ZBClient("localhost");

async function main() {
  zb.createWorker("raise-incident", "raise-incident", (job, complete) => {
    const { variables } = job;
    const { outcome_message, operation_success, product, name } = variables;
    if (operation_success) {
      return complete.success({
        outcome_message: `${product} manually shipped to ${name}`
      });
    }
    console.log("Raising incident");
    complete.failure(outcome_message);
  });
}

main();

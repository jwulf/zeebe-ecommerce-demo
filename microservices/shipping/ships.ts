import { ZBClient } from "zeebe-node";
import { printMemoryUsage } from "../lib/memory";
import { WorkflowVariables, WorkflowCustomHeaders } from "../interfaces";
import keypress from "keypress";

keypress(process.stdin);

let apiFailing = false;

process.stdin.on("keypress", function(ch, key) {
  if (!key) {
    return;
  }
  if (key.name == "c" && key.ctrl) {
    process.exit();
  }
  if (key.name == "f") {
    console.log("Shipping API is now failing");
    apiFailing = true;
  }
  if (key.name == "s") {
    console.log("Shipping API is back to normal");
    apiFailing = false;
  }
});

async function main() {
  const zb = new ZBClient();
  zb.createWorker<WorkflowVariables, WorkflowCustomHeaders, WorkflowVariables>({
    taskType: "ship-items",
    taskHandler: (job, complete) => {
      const { variables } = job;
      const { operation_success, outcome_message, delay } = apiFailing
        ? doesNotShip(variables)
        : ships(variables);
      /** Emulate a 2 second delay calling a third-party shipping API like Temando */
      setTimeout(() => {
        console.log(outcome_message);
        complete.success({ operation_success, outcome_message });
      }, delay);
    },
    maxJobsToActivate: 64
  });
  console.log("[S]hip, [F]ail shipping API");
}

function ships({ product, name }: { product: string; name: string }) {
  const operation_success = true;
  console.log(`Calling shipping API for ${name}...`);
  const outcome_message = `Shipped ${product} to ${name}`;
  return { operation_success, outcome_message, delay: 2000 };
}

function doesNotShip({ product, name }: { product: string; name: string }) {
  const operation_success = false;
  console.log(`Calling shipping API for ${name}...`);
  const outcome_message = `${product} purchased by ${name}, but did not ship!`;
  return { operation_success, outcome_message, delay: 0 };
}

main();

printMemoryUsage();

import { ZBClient } from "zeebe-node";
import { PaymentMethod } from "../interfaces";
import { printMemoryUsage } from "../lib/memory";

const zb = new ZBClient("localhost", {
  longPoll: 30000
});

async function main() {
  zb.createWorker(
    "payment-worker",
    "collect-payment",
    (job, complete) => {
      const { variables } = job;
      const { creditcard, name } = variables;
      const operation_success =
        creditcard == PaymentMethod.VALID_PAYMENT_METHOD;
      const outcome_message = operation_success
        ? `Payment successfully made by ${name}`
        : `Payment method declined for ${name}`;
      console.log(outcome_message);
      complete.success({ operation_success, outcome_message });
    },
    { pollInterval: 1000, loglevel: "INFO" }
  );
}

main();

printMemoryUsage();

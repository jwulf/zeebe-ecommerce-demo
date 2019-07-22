import { ZBClient } from "zeebe-node";
import { PaymentMethod } from "../interfaces";

const zb = new ZBClient("localhost");

async function main() {
  zb.createWorker("payment-worker", "charge-creditcard", (job, complete) => {
    const { variables } = job;
    const { creditcard, name } = variables;
    const operation_success = creditcard == PaymentMethod.VALID_PAYMENT_METHOD;
    const outcome_message = operation_success
      ? `Payment successfully made by ${name}`
      : `Payment method declined for ${name}`;
    complete.success({ operation_success, outcome_message });
  });
}

main();

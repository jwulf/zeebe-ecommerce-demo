import { ZBClient, Duration } from "zeebe-node";
import { PaymentMethod } from "../interfaces";

const zb = new ZBClient();

async function main() {
  zb.createWorker({
    taskType: "collect-payment",
    taskHandler: (job, complete) => {
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
    longPoll: Duration.seconds.of(60),
    loglevel: "INFO"
  });
}

main();

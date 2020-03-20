import { ZBClient, Duration } from "zeebe-node";
import {
  PaymentMethod,
  WorkflowVariables,
  WorkflowCustomHeaders
} from "../interfaces";
import { printMemoryUsage } from "../lib/memory";

async function main() {
  const zb = new ZBClient();
  zb.createWorker<WorkflowVariables, WorkflowCustomHeaders, WorkflowVariables>({
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
    timeout: Duration.seconds.of(30),
    longPoll: Duration.seconds.of(60),
    loglevel: "INFO",
    maxJobsToActivate: 64
  });
}

main();

printMemoryUsage();

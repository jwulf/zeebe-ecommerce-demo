import { ZBClient } from "zeebe-node";
import {
  PaymentMethod,
  WorkflowVariables,
  WorkflowCustomHeaders
} from "../interfaces";
import { printMemoryUsage } from "../lib/memory";
import brokerConfig from "../../zeebe-broker-connection";

async function main() {
  const zb = new ZBClient({
    longPoll: 10000,
    ...brokerConfig
  });
  zb.createWorker<WorkflowVariables, WorkflowCustomHeaders, WorkflowVariables>(
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
    {
      timeout: 10000,
      longPoll: 10000,
      loglevel: "INFO",
      maxJobsToActivate: 64
    }
  );
}

main();

printMemoryUsage();

export enum Product {
  ZEEBE_OSC_PACK = "ZEEBE_OSC_PACK",
  ESCALATION_ALE = "ESCALATION_ALE"
}

export enum PaymentMethod {
  VALID_PAYMENT_METHOD = "SOME_VALID_PAYMENT_METHOD",
  INVALID_PAYMENT_METHOD = "SOME_INVALID_PAYMENT_METHOD"
}

export interface WorkflowVariables {
  product: Product;
  name: string;
  creditcard: PaymentMethod;
  operation_success?: boolean;
  outcome_message?: string;
}

export type WorkflowCustomHeaders = never;

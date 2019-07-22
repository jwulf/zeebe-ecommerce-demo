import { purchase, Product, PaymentMethod } from "./lib/purchase";

purchase({
  product: Product.ESCALATION_ALE,
  creditcard: PaymentMethod.VALID_PAYMENT_METHOD
});

import { purchase, Product, PaymentMethod } from "./lib/purchase";

purchase({
  product: Product.ZEEBE_OSC_PACK,
  creditcard: PaymentMethod.INVALID_PAYMENT_METHOD
});

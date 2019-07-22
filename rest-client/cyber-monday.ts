import { purchase, Product, PaymentMethod } from "./lib/purchase";

for (let i = 0; i < 1000; i++) {
  setTimeout(
    () =>
      purchase({
        product: Product.ZEEBE_OSC_PACK,
        creditcard: PaymentMethod.VALID_PAYMENT_METHOD
      }),
    40 * i
  );
}

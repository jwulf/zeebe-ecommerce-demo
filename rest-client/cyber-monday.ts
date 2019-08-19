import { purchase, Product, PaymentMethod } from "./lib/purchase";

const start = new Date();
const hrstart = process.hrtime();

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

process.on("exit", () => {
  // const end = new Date() - start
  const hrend = process.hrtime(hrstart);

  // console.info('Execution time: %dms', end)
  console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1] / 1000000);
});

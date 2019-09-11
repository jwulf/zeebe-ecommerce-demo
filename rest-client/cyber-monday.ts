import { purchase, Product, PaymentMethod } from "./lib/purchase";

const hrstart = process.hrtime();
const iterations = 1000;

for (let i = 0; i < iterations - 1; i++) {
  setTimeout(
    () =>
      purchase({
        product: Product.ZEEBE_OSC_PACK,
        creditcard: PaymentMethod.VALID_PAYMENT_METHOD
      }),
    10 * i
  );
}

process.on("exit", () => {
  // const end = new Date() - start
  const hrend = process.hrtime(hrstart);

  // console.info('Execution time: %dms', end)
  console.log(`${iterations} transactions.`);
  console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1] / 1000000);
});

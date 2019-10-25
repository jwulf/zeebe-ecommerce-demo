import { purchase, Product, PaymentMethod } from "./lib/purchase";
import Axios from "axios";

const NUMBER_OF_ORDERS = 1000;

async function main() {
  const { parallelism } = (await Axios.get(
    "http://localhost:3000/api/parallelism"
  )).data;
  const hrstart = process.hrtime();

  for (let i = 0; i < NUMBER_OF_ORDERS; i++) {
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
    const seconds = hrend[0];
    const ms = hrend[1] / 1000000;
    console.log(`Workflows executed: ${NUMBER_OF_ORDERS}`);
    console.log(`Parallel workflow execution: ${parallelism}`);
    console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1] / 1000000);
    if (parallelism === 1) {
      const averageTime = seconds * 1000 + ms;
      console.log(`Average end-to-end time: ${averageTime}ms`);
    } else {
      console.log(
        `To get an end-to-end measurement per workflow, 
set MAX_PARALLEL_WORKFLOWS=1 in rest-server/config.ts 
and restart the REST server`
      );
    }
  });
}

main();

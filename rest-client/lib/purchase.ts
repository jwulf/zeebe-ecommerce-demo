import axios from "axios";
import random from "node-random-name";

const BASE_URL = "http://localhost:3000";
const httpClient = axios.create();

httpClient.defaults.timeout = 15000;

export async function purchase(req: PurchaseRequest) {
  const request = {
    ...req,
    name: random()
  };
  console.log("\n============");
  console.log({ Request: request });
  console.log(`\n`);
  const outcome = await httpClient.post(`${BASE_URL}/api/purchase`, request);
  if (outcome.data && outcome.data.callback) {
    // We poll for an eventual result
    console.log("Polling to retrieve outcome...");
    pollForResult(`${BASE_URL}${outcome.data.callback}`).then(printResult);
  } else {
    printResult(outcome);
  }
}

/**
 * Continually poll for the outcome until we get it
 */
function pollForResult(url) {
  return new Promise((resolve, reject) => {
    function pollAgain() {
      setTimeout(async () => {
        try {
          const outcome = await httpClient.get(url);
          resolve(outcome);
        } catch (e) {
          pollAgain();
        }
      }, 1000);
    }
    pollAgain();
  });
}

function printResult(outcome) {
  console.log({ Response: outcome.data });
}

export enum Product {
  ZEEBE_OSC_PACK = "ZEEBE_OSC_PACK",
  ESCALATION_ALE = "ESCALATION_ALE"
}

export enum PaymentMethod {
  VALID_PAYMENT_METHOD = "SOME_VALID_PAYMENT_METHOD",
  INVALID_PAYMENT_METHOD = "SOME_INVALID_PAYMENT_METHOD"
}

interface PurchaseRequest {
  product: Product;
  creditcard: PaymentMethod;
}

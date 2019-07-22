import axios from "axios";
import random from "node-random-name";

export async function purchase(req: PurchaseRequest) {
  const request = {
    ...req,
    name: random()
  };
  console.log("\n============");
  console.log({ Request: request });
  console.log(`\n`);
  const outcome = await axios.post(
    "http://localhost:3000/api/purchase",
    request
  );
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

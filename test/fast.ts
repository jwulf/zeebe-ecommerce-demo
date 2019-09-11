import { ZBClient } from "zeebe-node";

const zb = new ZBClient("localhost", {
  // longPoll: 300000
});

export default () =>
  zb.createWorker(
    (undefined as unknown) as string,
    "check-inventory",
    (job, complete) => {
      console.log(job);
    },
    { loglevel: "INFO", maxJobsToActivate: 128, pollInterval: 1000 }
  );

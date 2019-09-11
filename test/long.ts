export default zb =>
  zb.createWorker(
    (undefined as unknown) as string,
    "check-inventory",
    (job, complete) => {
      console.log(job);
    },
    { loglevel: "INFO", maxJobsToActivate: 128 }
  );

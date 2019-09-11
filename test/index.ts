const readline = require("readline");
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode!(true);

import stats from "docker-stats";
import through from "through2";
import { v4 as uuid } from "uuid";
// Note: requires 0.21.0 of the zeebe-node lib
import { ZBClient } from "zeebe-node";

// Emit averadge CPU usage every 15 seconds
stats({
  statsinterval: 15,
  matchByName: /zeebe_broker/
})
  .pipe(
    through.obj(function(chunk, enc, cb) {
      const cpu = chunk.stats.cpu_stats.cpu_usage.cpu_percent;
      this.push(
        `Fast: ${fast} || Slow: ${slow} || Long: ${long} || CPU: ${cpu}`
      );
      this.push("\n");
      cb();
    })
  )
  .pipe(process.stdout);

let fast = 0;
let long = 0;
let slow = 0;

let zbcLong = new ZBClient("localhost", {
  longPoll: 300000
});
const zbcShort = new ZBClient("localhost");

const unusedHandler = (job, complete) => console.log(job);

const createLongpollWorker = currentZbcLong =>
  currentZbcLong.createWorker(uuid(), "nonexistent-task-type", unusedHandler);

const createFastPollWorker = () =>
  zbcShort.createWorker(uuid(), "nonexistent-task-type", unusedHandler);

const createSlowPollWorker = () =>
  zbcShort.createWorker(uuid(), "nonexistent-task-type", unusedHandler, {
    pollInterval: 1000
  });

console.log("Start a (f)astpoll worker, (s)lowpoll or (l)ongpoll worker");
process.stdin.on("keypress", function(ch, key) {
  if (key.name == "f") {
    createFastPollWorker();
    fast++;
  }
  if (key.name == "s") {
    createSlowPollWorker();
    slow++;
  }
  if (key.name == "l") {
    createLongpollWorker(zbcLong);
    // Too many long polling workers on a single gRPC connection is a problem
    if (long++ % 40 == 0) {
      zbcLong = new ZBClient("localhost", {
        longPoll: 300000
      });
    }
  }
  if (key && key.ctrl && key.name == "c") {
    process.exit();
  }
  console.log(`Fast: ${fast} || Slow: ${slow} || Long: ${long}`);
});

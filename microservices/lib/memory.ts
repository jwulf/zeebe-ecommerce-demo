export function printMemoryUsage() {
  setInterval(
    () =>
      console.log(`Memory usage: ${process.memoryUsage().rss / 1024 / 1024}MB`),
    10000
  );
}

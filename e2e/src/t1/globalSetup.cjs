/**
 * Builds the harness app and serves it from an in-process vite preview server
 * for the duration of the t1 run. The production build keeps StrictMode off.
 * The server lives in the jest main process; worker browsers reach it over TCP.
 */
const path = require("node:path");

module.exports = async () => {
  const { build, preview } = await import("vite");
  const root = path.resolve(__dirname, "..", "..");
  const configFile = path.resolve(root, "vite.config.ts");
  const port = Number(process.env.HARNESS_PORT || 4173);

  await build({ root, configFile, logLevel: "warn" });

  const server = await preview({
    root,
    configFile,
    preview: { port, strictPort: true, host: "127.0.0.1" },
  });

  globalThis.__HARNESS_PREVIEW__ = server;
  process.env.HARNESS_BASE_URL = `http://127.0.0.1:${port}`;
  // eslint-disable-next-line no-console
  console.log(`\n[t1] harness served at ${process.env.HARNESS_BASE_URL}`);
};

const { build } = require("esbuild");
const config = require("@stackflow/esbuild-config");

const watch = process.argv.includes("--watch");

Promise.all([
  build({
    ...config({}),
    format: "cjs",
    watch,
  }),
  build({
    ...config({}),
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    watch,
  }),
]).catch(() => process.exit(1));

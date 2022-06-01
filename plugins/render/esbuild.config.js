const { build } = require("esbuild");
const config = require("@stackflow/esbuild-config");

Promise.all([
  build({
    ...config({}),
    format: "cjs",
  }),
  build({
    ...config({}),
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
  }),
]).catch(() => process.exit(1));

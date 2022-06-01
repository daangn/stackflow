const { build } = require("esbuild");
const config = require("@stackflow/esbuild-config");

Promise.all([
  build({
    ...config({}),
    format: "cjs",
    external: ["@stackflow/react", "react"],
  }),
  build({
    ...config({}),
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    external: ["@stackflow/react", "react"],
  }),
]).catch(() => process.exit(1));

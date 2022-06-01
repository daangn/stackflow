const { build } = require("esbuild");
const config = require("@stackflow/esbuild-config");

Promise.all([
  build({
    ...config({}),
    format: "cjs",
    external: ["@stackflow/react", "react"],
    minify: true,
  }),
  build({
    ...config({}),
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    external: ["@stackflow/react", "react"],
    minify: true,
  }),
]).catch(() => process.exit(1));

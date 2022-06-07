const { build } = require("esbuild");
const config = require("@stackflow/esbuild-config");

const watch = process.argv.includes("--watch");

Promise.all([
  build({
    ...config({}),
    format: "cjs",
    external: ["@stackflow/react", "react"],
    minify: true,
    watch,
  }),
  build({
    ...config({}),
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    external: ["@stackflow/react", "react"],
    minify: true,
    watch,
  }),
]).catch(() => process.exit(1));

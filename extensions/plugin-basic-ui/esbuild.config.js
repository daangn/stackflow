const { build } = require("esbuild");
const config = require("@stackflow/esbuild-config");
const pkg = require("./package.json");

const watch = process.argv.includes("--watch");
const external = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
});

Promise.all([
  build({
    ...config({
      vanillaExtractIdentifiers: watch ? "debug" : "short",
    }),
    format: "cjs",
    external,
    watch,
  }),
  build({
    ...config({
      vanillaExtractIdentifiers: watch ? "debug" : "short",
    }),
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    external,
    watch,
  }),
]).catch(() => process.exit(1));

const { build } = require("esbuild");
const config = require("@stackflow/esbuild-config");
const pkg = require("./package.json");

const external = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
});
const watch = process.argv.includes("--watch");

Promise.all([
  build({
    ...config({}),
    format: "cjs",
    watch,
    external,
    minify: !watch,
  }),
  build({
    ...config({}),
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    external,
    watch,
    minify: !watch,
  }),
]).catch(() => process.exit(1));

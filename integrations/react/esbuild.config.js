const { context } = require("esbuild");
const config = require("@stackflow/esbuild-config");
const pkg = require("./package.json");

const external = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
});
const watch = process.argv.includes("--watch");

Promise.all([
  context({
    ...config({}),
    format: "cjs",
    external,
  }).then((ctx) =>
    watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
  ),
  context({
    ...config({}),
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    external,
  }).then((ctx) =>
    watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
  ),
]).catch(() => process.exit(1));

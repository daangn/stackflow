const { context } = require("esbuild");
const config = require("@stackflow/esbuild-config");

const watch = process.argv.includes("--watch");

Promise.all([
  context({
    ...config({
      entryPoints: ["./src/**/*"],
    }),
    bundle: false,
    external: undefined,
    format: "cjs",
    sourcemap: false,
  }).then((ctx) =>
    watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
  ),
  context({
    ...config({
      entryPoints: ["./src/**/*"],
    }),
    bundle: false,
    external: undefined,
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    sourcemap: false,
  }).then((ctx) =>
    watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
  ),
]).catch(() => process.exit(1));

const { context } = require("esbuild");
const config = require("@stackflow/esbuild-config");

const watch = process.argv.includes("--watch");

Promise.all([
  context({
    ...config({
      entryPoints: ["./src/**/*"],
    }),
    bundle: false,
    format: "esm",
    sourcemap: false,
    external: undefined,
  }).then((ctx) =>
    watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
  ),
]).catch(() => process.exit(1));

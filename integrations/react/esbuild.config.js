const { context } = require("esbuild");
const config = require("@stackflow/esbuild-config");

const watch = process.argv.includes("--watch");

Promise.all([
  context({
    ...config({
      entryPoints: ["./src/**/*"],
      outdir: "dist/cjs",
    }),
    bundle: false,
    sourcemap: false,
    external: undefined,
    format: "cjs",
  }).then((ctx) =>
    watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
  ),
  context({
    ...config({
      entryPoints: ["./src/**/*"],
      outdir: "dist/esm",
    }),
    bundle: false,
    sourcemap: false,
    external: undefined,
    format: "esm",
  }).then((ctx) =>
    watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
  ),
]).catch(() => process.exit(1));

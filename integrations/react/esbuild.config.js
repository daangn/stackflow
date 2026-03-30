const { readdirSync, statSync } = require("fs");
const { join } = require("path");
const { context } = require("esbuild");
const config = require("@stackflow/esbuild-config");
const {
  esbuildPluginFilePathExtensions,
} = require("esbuild-plugin-file-path-extensions");
const pkg = require("./package.json");

const watch = process.argv.includes("--watch");

const external = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
});

const entryPoints = readdirSync("./src", { recursive: true })
  .map((f) => join("./src", f))
  .filter((f) => !f.includes(".spec.") && statSync(f).isFile());

Promise.all([
  context({
    ...config({
      entryPoints,
      outdir: "dist",
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
      entryPoints,
      outdir: "dist",
    }),
    bundle: true,
    sourcemap: false,
    external,
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    plugins: [esbuildPluginFilePathExtensions()],

    // https://github.com/favware/esbuild-plugin-file-path-extensions/blob/b8efeff0489c1b02540109f6ea8c39fcd90f9dfc/src/index.ts#L202
    platform: "node",
  }).then((ctx) =>
    watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
  ),
]).catch(() => process.exit(1));

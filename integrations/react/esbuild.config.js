const fs = require("node:fs");
const path = require("node:path");
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

/**
 * Equivalent to the `./src/**\/*` glob, except that test files (`*.spec.*`)
 * are excluded from the build output.
 */
function listEntryPoints(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return listEntryPoints(fullPath);
    }

    return entry.name.includes(".spec.") ? [] : [fullPath];
  });
}

const entryPoints = listEntryPoints("./src");

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

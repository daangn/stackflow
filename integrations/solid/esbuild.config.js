const { context } = require("esbuild");
const config = require("@stackflow/esbuild-config");
const { solidPlugin } = require("esbuild-plugin-solid");
const pkg = require("./package.json");

const external = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
});
const watch = process.argv.includes("--watch");

Promise.all(
  [true, false].flatMap((jsx) =>
    [
      { format: "cjs", extPrefix: "" },
      { format: "esm", extPrefix: "m" },
    ].map(({ format, extPrefix }) =>
      context({
        ...config({
          plugins: !jsx ? [solidPlugin({ solid: { generate: "dom" } })] : [],
        }),
        format,
        outExtension: jsx
          ? { ".js": `.${extPrefix}jsx` }
          : { ".js": `.${extPrefix}js` },
        jsx: "preserve",
        external,
      }).then((ctx) =>
        watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
      ),
    ),
  ),
).catch(() => process.exit(1));

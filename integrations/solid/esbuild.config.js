const { context } = require("esbuild");
const config = require("@stackflow/esbuild-config");
const {
  esbuildPluginFilePathExtensions,
} = require("esbuild-plugin-file-path-extensions");
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
      {
        format: "cjs",
        extPrefix: "",
        bundle: false,
        external: undefined,
      },
      {
        format: "esm",
        extPrefix: "m",
        bundle: true,
        external,
        plugins: [
          esbuildPluginFilePathExtensions({
            esmExtension: jsx ? "mjsx" : "mjs",
          }),
        ],
        platform: "node",
      },
    ].map(({ format, extPrefix, bundle, external, plugins, platform }) =>
      context({
        ...config({
          entryPoints: ["./src/**/*"],
          plugins: [
            ...(!jsx ? [solidPlugin({ solid: { generate: "dom" } })] : []),
            ...(plugins ?? []),
          ],
        }),
        bundle,
        format,
        outExtension: jsx
          ? { ".js": `.${extPrefix}jsx` }
          : { ".js": `.${extPrefix}js` },
        jsx: "preserve",
        external,
        platform,
      }).then((ctx) =>
        watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
      ),
    ),
  ),
).catch(() => process.exit(1));

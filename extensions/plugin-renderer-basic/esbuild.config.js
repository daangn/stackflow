const { context } = require("esbuild");
const config = require("@stackflow/esbuild-config");
const { solidPlugin } = require("esbuild-plugin-solid");
const pkg = require("./package.json");

const watch = process.argv.includes("--watch");
const external = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
});

const solidEntryPoints = ["./src/solid.tsx"];
const allEntryPoints = ["./src/react.tsx", ...solidEntryPoints];

Promise.all(
  [
    { jsx: true, browser: false, entryPoints: solidEntryPoints },
    { jsx: false, browser: true, entryPoints: solidEntryPoints },
    { jsx: false, browser: false, entryPoints: allEntryPoints },
  ].flatMap(({ jsx, browser, entryPoints }) =>
    [
      { format: "cjs", extPrefix: "" },
      { format: "esm", extPrefix: "m" },
    ].map(({ format, extPrefix }) =>
      context({
        ...config({
          entryPoints,
          plugins: !jsx
            ? [
                solidPlugin({
                  filter: /(?:^|\/)solid\.tsx$/,
                  solid: { generate: browser ? "dom" : "ssr" },
                }),
              ]
            : [],
        }),
        outbase: "src",
        format,
        outExtension: jsx
          ? { ".js": `${browser ? ".browser" : ""}.${extPrefix}jsx` }
          : { ".js": `${browser ? ".browser" : ""}.${extPrefix}js` },
        jsx: jsx ? "preserve" : undefined,
        external,
      }).then((ctx) =>
        watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
      ),
    ),
  ),
).catch(() => process.exit(1));

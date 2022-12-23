const { build } = require("esbuild");
const config = require("@stackflow/esbuild-config");
const pkg = require("./package.json");

const watch = process.argv.includes("--watch");
const external = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
});

Promise.all([
  build({
    ...config({}),
    format: "cjs",
    external,
    define: {
      "process.env.PACKAGE_NAME": `"${pkg.name}"`,
      "process.env.PACKAGE_VERSION": `"${pkg.version}"`,
    },
    watch,
  }),
  build({
    ...config({}),
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    external,
    define: {
      "process.env.PACKAGE_NAME": `"${pkg.name}"`,
      "process.env.PACKAGE_VERSION": `"${pkg.version}"`,
    },
    watch,
  }),
]).catch(() => process.exit(1));

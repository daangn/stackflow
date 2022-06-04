const { build } = require("esbuild");
const config = require("@stackflow/esbuild-config");
const pkg = require("./package.json");

const watch = process.argv.includes("--watch");

Promise.all([
  build({
    ...config({}),
    format: "cjs",
    external: ["@stackflow/react", "react"],
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
    external: ["@stackflow/react", "react"],
    define: {
      "process.env.PACKAGE_NAME": `"${pkg.name}"`,
      "process.env.PACKAGE_VERSION": `"${pkg.version}"`,
    },
    watch,
  }),
]).catch(() => process.exit(1));

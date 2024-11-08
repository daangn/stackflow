import config from "@stackflow/esbuild-config";
import { context } from "esbuild";

import pkg from "./package.json" assert { type: "json" };

const watch = process.argv.includes("--watch");
const external = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
});

Promise.all([
  context({
    ...config({
      entryPoints: ["./src/stackflow/stackflow.docs.tsx"],
      outdir: "./dist/stackflow",
      vanillaExtractExternal: ["@seed-design"],
    }),
    format: "cjs",
    external,
  }).then((ctx) =>
    watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
  ),
  context({
    ...config({
      entryPoints: ["./src/stackflow/stackflow.docs.tsx"],
      outdir: "./dist/stackflow",
      vanillaExtractExternal: ["@seed-design"],
    }),
    format: "esm",
    outExtension: {
      ".js": ".mjs",
    },
    external,
  }).then((ctx) =>
    watch ? ctx.watch() : ctx.rebuild().then(() => ctx.dispose()),
  ),
]).catch(() => process.exit(1));

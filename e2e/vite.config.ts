import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const pkg = (rel: string) => resolve(repoRoot, rel);

/**
 * The harness drives the CURRENT source of both plugins (and their stackflow
 * dependencies), not a built dist — so it reproduces the unfixed behavior as a
 * red safety net and picks up the product fix immediately. We therefore alias
 * the workspace packages to their `src` entry points.
 */
export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: /^@stackflow\/core$/, replacement: pkg("core/src/index.ts") },
      {
        find: /^@stackflow\/react$/,
        replacement: pkg("integrations/react/src/index.ts"),
      },
      {
        find: /^@stackflow\/config$/,
        replacement: pkg("config/src/index.ts"),
      },
      {
        find: /^@stackflow\/plugin-history-sync$/,
        replacement: pkg("extensions/plugin-history-sync/src/index.ts"),
      },
      {
        find: /^@stackflow\/plugin-blocker$/,
        replacement: pkg("extensions/plugin-blocker/src/index.ts"),
      },
      {
        find: /^@stackflow\/plugin-renderer-basic$/,
        replacement: pkg("extensions/plugin-renderer-basic/src/index.ts"),
      },
    ],
  },
  server: {
    fs: {
      // The aliased sources live above this package's root.
      allow: [repoRoot],
    },
  },
  plugins: [react()],
});

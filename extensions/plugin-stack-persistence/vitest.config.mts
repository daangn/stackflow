import * as path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Runtime specs import the package by its public name; the boundary
      // suite separately exercises the real dist resolution as a consumer.
      "@stackflow/plugin-stack-persistence": path.resolve(
        import.meta.dirname,
        "src/index.ts",
      ),
    },
  },
  test: {
    environment: "node",
    include: [
      "src/**/*.spec.ts",
      "type-tests/**/*.spec.ts",
      "boundary-tests/**/*.spec.ts",
    ],
    // The type suite and the package-boundary suite shell out to tsc /
    // esbuild / node subprocesses, which do not fit the default 5s budget.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});

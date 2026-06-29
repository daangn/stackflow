/**
 * Both gate tiers run under jest (which resolves cleanly under this repo's Yarn
 * PnP setup):
 *
 *  - t1  : real Chromium. A `node` environment drives the harness app through
 *          the `playwright` library. A built app is served by an in-process
 *          vite preview started in globalSetup.
 *  - t2i : jsdom integration. Both plugins applied; timing-independent
 *          blocker-internal contracts (error isolation, notification order).
 *
 * Both map the @stackflow/* packages to their `src` so the suites exercise the
 * current source, not a built dist.
 */

const swcTransform = [
  "@swc/jest",
  {
    jsc: {
      transform: { react: { runtime: "automatic" } },
    },
  },
];

const stackflowSrc = {
  "^@stackflow/core$": "<rootDir>/../core/src/index.ts",
  "^@stackflow/react$": "<rootDir>/../integrations/react/src/index.ts",
  "^@stackflow/config$": "<rootDir>/../config/src/index.ts",
  "^@stackflow/plugin-history-sync$":
    "<rootDir>/../extensions/plugin-history-sync/src/index.ts",
  "^@stackflow/plugin-blocker$":
    "<rootDir>/../extensions/plugin-blocker/src/index.ts",
  "^@stackflow/plugin-renderer-basic$":
    "<rootDir>/../extensions/plugin-renderer-basic/src/index.ts",
};

module.exports = {
  projects: [
    {
      displayName: "t1",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/t1/**/*.spec.ts"],
      transform: { "^.+\\.(t|j)sx?$": swcTransform },
      setupFilesAfterEnv: ["<rootDir>/src/t1/setup.cjs"],
      globalSetup: "<rootDir>/src/t1/globalSetup.cjs",
      globalTeardown: "<rootDir>/src/t1/globalTeardown.cjs",
    },
    {
      displayName: "t2i",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/src/t2i/**/*.spec.tsx"],
      transform: { "^.+\\.(t|j)sx?$": swcTransform },
      moduleNameMapper: stackflowSrc,
    },
  ],
};

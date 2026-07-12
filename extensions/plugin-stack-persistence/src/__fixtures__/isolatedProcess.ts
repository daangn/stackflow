import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const FIXTURES_DIR = fileURLToPath(new URL(".", import.meta.url));
const PACKAGE_ROOT = path.resolve(FIXTURES_DIR, "..", "..");
const REPO_ROOT = path.resolve(PACKAGE_ROOT, "..", "..");
const OUT_DIR = path.join(PACKAGE_ROOT, ".harness-out");

export type IsolatedRunResult = {
  status: number | null;
  /** The child's single-line JSON report, or `null` if it never printed one. */
  report: Record<string, unknown> | null;
  stdout: string;
  stderr: string;
};

/**
 * Runs a child fixture from `src/__fixtures__/isolated/` in a separate
 * Node process, so unhandled asynchronous errors can be observed without
 * poisoning the vitest process. The fixture is bundled with esbuild
 * (package sources inlined, `@stackflow/core` left external and resolved
 * through the repo's PnP runtime) and is expected to print a one-line
 * JSON report as its last stdout line.
 */
export function runIsolatedChild(childFileName: string): IsolatedRunResult {
  const entry = path.join(FIXTURES_DIR, "isolated", childFileName);
  const outfile = path.join(OUT_DIR, childFileName.replace(/\.ts$/, ".cjs"));

  buildSync({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node18",
    sourcemap: false,
    logLevel: "silent",
    external: ["@stackflow/core"],
    alias: {
      "@stackflow/plugin-stack-persistence": path.join(
        PACKAGE_ROOT,
        "src",
        "index.ts",
      ),
    },
  });

  try {
    const result = spawnSync(process.execPath, [outfile], {
      encoding: "utf8",
      timeout: 30_000,
      cwd: PACKAGE_ROOT,
      env: {
        ...process.env,
        NODE_OPTIONS: `--require ${path.join(REPO_ROOT, ".pnp.cjs")}`,
      },
    });

    const lines = (result.stdout ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let report: Record<string, unknown> | null = null;
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
      try {
        report = JSON.parse(lastLine);
      } catch {
        report = null;
      }
    }

    return {
      status: result.status,
      report,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  } finally {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
}

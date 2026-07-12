import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

/**
 * Consumer-boundary audit: unlike the runtime suite (which resolves the
 * package to its sources), this suite exercises what a real consumer
 * gets — the manifest, the built artifacts, and a plain Node process
 * requiring the package by name.
 */
const BOUNDARY_DIR = fileURLToPath(new URL(".", import.meta.url));
const PACKAGE_ROOT = path.resolve(BOUNDARY_DIR, "..");
const REPO_ROOT = path.resolve(PACKAGE_ROOT, "..", "..");
const DIST_DIR = path.join(PACKAGE_ROOT, "dist");

const manifest = JSON.parse(
  fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"),
) as {
  name: string;
  exports: Record<string, unknown>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

describe("package는 React·환경별 entrypoint 없이 core plugin으로 사용 가능하다", () => {
  test("manifest는 React 의존과 plugin-history-sync 결합 없이 단일 entrypoint로 dist 산출물만 가리킨다", () => {
    expect(manifest.name).toBe("@stackflow/plugin-stack-persistence");

    const declaredDependencies = Object.keys({
      ...manifest.dependencies,
      ...manifest.peerDependencies,
      ...manifest.optionalDependencies,
    });
    expect(declaredDependencies).not.toContain("react");
    expect(declaredDependencies).not.toContain("react-dom");
    expect(declaredDependencies).not.toContain("@types/react");
    expect(declaredDependencies).not.toContain("@stackflow/react");
    expect(declaredDependencies).not.toContain(
      "@stackflow/plugin-history-sync",
    );
    expect(manifest.peerDependencies).toEqual({
      "@stackflow/core": expect.any(String),
    });

    // 별도 React/환경별 entrypoint 없이 "." 하나뿐이다
    expect(Object.keys(manifest.exports)).toEqual(["."]);
    expect(manifest.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      require: "./dist/index.js",
      import: "./dist/index.mjs",
    });
  });

  test("빌드 산출물이 존재하고 어느 산출물도 React를 참조하지 않는다", () => {
    const artifacts = ["index.js", "index.mjs", "index.d.ts"];
    for (const artifact of artifacts) {
      expect(
        fs.existsSync(path.join(DIST_DIR, artifact)),
        `dist/${artifact}가 없습니다 — build가 선행되어야 합니다`,
      ).toBe(true);
    }

    for (const artifact of artifacts) {
      const content = fs.readFileSync(path.join(DIST_DIR, artifact), "utf8");
      expect(content).not.toMatch(/require\(["']react["']\)/);
      expect(content).not.toMatch(/from ["']react["']/);
    }
  });

  test("소비자 컴파일: React 타입 없이 빌드된 선언만으로 strict 컴파일된다", () => {
    const result = spawnSync(
      "yarn",
      [
        "tsc",
        "-p",
        path.join(BOUNDARY_DIR, "consumer", "tsconfig.json"),
        "--pretty",
        "false",
      ],
      { cwd: PACKAGE_ROOT, encoding: "utf8", timeout: 180_000 },
    );

    expect(
      result.status,
      `소비자 fixture가 dist 선언으로 컴파일되지 않았습니다:\n${result.stdout}${result.stderr}`,
    ).toBe(0);
  });

  test("React가 resolve조차 되지 않고 browser global도 없는 node process에서 package를 이름으로 require해 core store에 연결할 수 있다", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--require",
        path.join(REPO_ROOT, ".pnp.cjs"),
        path.join(BOUNDARY_DIR, "consumer", "consumerRuntime.cjs"),
      ],
      { cwd: PACKAGE_ROOT, encoding: "utf8", timeout: 60_000 },
    );

    const lastLine = result.stdout.trim().split("\n").at(-1) ?? "";
    let report: Record<string, unknown> | null = null;
    try {
      report = JSON.parse(lastLine);
    } catch {
      report = null;
    }

    expect(
      report,
      `consumer runtime fixture가 report를 출력하지 못했습니다.\nstderr: ${result.stderr}\nstdout: ${result.stdout}`,
    ).not.toBeNull();
    const observed = report as Record<string, unknown>;

    // browser global 없는 process에서 React는 resolve조차 되지 않는다
    expect(observed.windowAbsent).toBe(true);
    expect(observed.reactResolvable).toBe(false);

    // plugin-history-sync와 분리된 패키지다 — 의존 그래프에 존재하지 않는다
    expect(observed.historySyncResolvable).toBe(false);

    // 확정 공개 이름이 entrypoint에 존재한다
    expect(observed.publicExports).toEqual(
      expect.arrayContaining([
        "StackPersistenceLoadError",
        "StackPersistenceSaveError",
        "stackPersistencePlugin",
      ]),
    );
    expect(observed.loadErrorExtendsError).toBe(true);
    expect(observed.saveErrorExtendsError).toBe(true);

    // core store에 연결되어 정상 동작한다
    expect(
      observed.connected,
      `core store 연결 실패: ${String(observed.error)}`,
    ).toBe(true);
    expect(observed.activityNames).toEqual(["Home"]);
    expect(result.status).toBe(0);
  });
});

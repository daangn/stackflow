import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

/**
 * The type-level contracts are judged by the real compiler, in two runs:
 *
 * 1. As committed (`@ts-expect-error` directives in place) every fixture
 *    must compile cleanly — an unused directive is itself a compile error,
 *    so this run already proves each flagged line is a type error.
 * 2. A generated control copy strips the directives (preserving line
 *    numbers) and must fail at exactly the flagged lines — proving each
 *    negative fails for its own contract, not by accident, and that the
 *    checks keep their teeth if a directive is ever deleted.
 */
const TYPE_TESTS_DIR = fileURLToPath(new URL(".", import.meta.url));
const PACKAGE_ROOT = path.resolve(TYPE_TESTS_DIR, "..");
const FIXTURES_DIR = path.join(TYPE_TESTS_DIR, "fixtures");
const CONTROL_DIR = path.join(TYPE_TESTS_DIR, ".control");

const DIRECTIVE_PATTERN = /^\s*\/\/ @ts-expect-error/;

const FIXTURES = [
  {
    file: "publicSurface.ts",
    title: "패키지 공개 이름과 core plugin 계약 대입",
  },
  {
    file: "recordAndStorage.ts",
    title: "record와 storage의 동기 read/비동기 write 기본 구조",
  },
  {
    file: "optionsWithoutStrategy.ts",
    title: "strategy 없는 options의 metadata undefined",
  },
  {
    file: "optionsMetadataInference.ts",
    title: "strategy가 options의 단일 Metadata를 추론",
  },
  {
    file: "strategyContract.ts",
    title: "strategy의 동기·readonly·unknown 계약",
  },
  {
    file: "errorContract.ts",
    title: "오류 class, cause, handler policy 계약",
  },
  {
    file: "singleInjectionSurface.ts",
    title: "단일 storage/strategy와 수동 lifecycle API 부재",
  },
] as const;

type Diagnostic = { file: string; line: number; code: string };

function runTsc(projectPath: string): Diagnostic[] {
  const result = spawnSync(
    "yarn",
    ["tsc", "-p", projectPath, "--pretty", "false"],
    { cwd: PACKAGE_ROOT, encoding: "utf8", timeout: 180_000 },
  );

  if (result.error) {
    throw result.error;
  }

  const diagnostics: Diagnostic[] = [];
  for (const line of `${result.stdout}\n${result.stderr}`.split("\n")) {
    const match = /^(.+?)\((\d+),\d+\): error (TS\d+):/.exec(line.trim());
    if (match) {
      diagnostics.push({
        file: path.resolve(PACKAGE_ROOT, match[1]),
        line: Number(match[2]),
        code: match[3],
      });
    }
  }

  return diagnostics;
}

function diagnosticsFor(diagnostics: Diagnostic[], dir: string, file: string) {
  const absolute = path.join(dir, "fixtures", file);
  return diagnostics.filter((diagnostic) => diagnostic.file === absolute);
}

/** Lines (1-based) that a stripped control must fail on: directive line + 1. */
function expectedControlErrorLines(fixtureFile: string): number[] {
  const source = fs.readFileSync(path.join(FIXTURES_DIR, fixtureFile), "utf8");
  const lines = source.split("\n");
  const expected: number[] = [];
  lines.forEach((line, index) => {
    if (DIRECTIVE_PATTERN.test(line)) {
      expected.push(index + 2);
    }
  });
  return expected;
}

function writeControlCopy(): void {
  fs.rmSync(CONTROL_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(CONTROL_DIR, "fixtures"), { recursive: true });

  for (const entry of fs.readdirSync(FIXTURES_DIR)) {
    const source = fs.readFileSync(path.join(FIXTURES_DIR, entry), "utf8");
    // Replace each directive with an inert comment on the same line so
    // every other line number is preserved.
    const stripped = source
      .split("\n")
      .map((line) =>
        DIRECTIVE_PATTERN.test(line)
          ? line.replace(/\/\/ @ts-expect-error.*$/, "// (control)")
          : line,
      )
      .join("\n");
    fs.writeFileSync(path.join(CONTROL_DIR, "fixtures", entry), stripped);
  }

  // baseUrl/paths inherited from the fixtures tsconfig resolve relative to
  // where they are declared, so only `include` needs to be redeclared here.
  fs.writeFileSync(
    path.join(CONTROL_DIR, "tsconfig.json"),
    `${JSON.stringify({ extends: "../tsconfig.json", include: ["fixtures"] }, null, 2)}\n`,
  );
}

let directiveRunDiagnostics: Diagnostic[] = [];
let controlRunDiagnostics: Diagnostic[] = [];

beforeAll(() => {
  directiveRunDiagnostics = runTsc(path.join(TYPE_TESTS_DIR, "tsconfig.json"));

  // Harness self-check: this project also compiles the runner itself, so a
  // diagnostic outside the fixtures directory is a harness defect.
  const outsideFixtures = directiveRunDiagnostics.filter(
    (diagnostic) => !diagnostic.file.startsWith(FIXTURES_DIR),
  );
  if (outsideFixtures.length > 0) {
    throw new Error(
      `type harness itself failed to compile: ${JSON.stringify(outsideFixtures)}`,
    );
  }

  writeControlCopy();
  controlRunDiagnostics = runTsc(path.join(CONTROL_DIR, "tsconfig.json"));
});

afterAll(() => {
  fs.rmSync(CONTROL_DIR, { recursive: true, force: true });
});

for (const { file, title } of FIXTURES) {
  describe(`타입 계약: ${title}`, () => {
    test("지시자가 있는 상태의 fixture는 오류 없이 컴파일된다 — 사용되지 않은 지시자도 오류다", () => {
      expect(
        diagnosticsFor(directiveRunDiagnostics, TYPE_TESTS_DIR, file),
      ).toEqual([]);
    });

    test("지시자를 제거한 control은 예상한 진단 위치들에서, 그리고 그 위치들에서만 컴파일 실패한다", () => {
      const expectedLines = expectedControlErrorLines(file);
      const actualLines = Array.from(
        new Set(
          diagnosticsFor(controlRunDiagnostics, CONTROL_DIR, file).map(
            (diagnostic) => diagnostic.line,
          ),
        ),
      ).sort((a, b) => a - b);

      expect(actualLines).toEqual(expectedLines);
    });
  });
}

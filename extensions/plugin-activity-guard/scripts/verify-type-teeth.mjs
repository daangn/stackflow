import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourcePath = path.join(
  packageDirectory,
  "src",
  "activityGuardPlugin.type-spec.ts",
);
const probePath = path.join(packageDirectory, "src", "__type-teeth-probe__.ts");
const yarnPath = process.env.npm_execpath;

if (!yarnPath) {
  throw new Error("verify:type-teeth must run through Yarn");
}

function runTypecheckExpectingFailure({ label, expectedDiagnostic }) {
  try {
    execFileSync(yarnPath, ["exec", "tsc", "--noEmit"], {
      cwd: packageDirectory,
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch (error) {
    const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    const hasProbeDiagnostic = output
      .split("\n")
      .some(
        (line) =>
          line.includes(path.basename(probePath)) &&
          line.includes(`error ${expectedDiagnostic ?? "TS"}`),
      );
    if (!hasProbeDiagnostic) {
      throw new Error(
        `${label}: expected ${expectedDiagnostic ?? "a TypeScript diagnostic"} from ${path.basename(probePath)}, received:\n${output}`,
      );
    }
    return;
  }
  throw new Error(`${label}: expected typecheck to fail`);
}

const source = readFileSync(sourcePath, "utf8");
const directives = [
  ...source.matchAll(/^\s*\/\/ @ts-expect-error (TYPE-\d{2})[^\n]*\n/gm),
];

if (directives.length === 0) {
  throw new Error("No type negative-control directives were found");
}

try {
  for (const [index, directive] of directives.entries()) {
    const start = directive.index;
    const withoutDirective =
      source.slice(0, start) + source.slice(start + directive[0].length);
    writeFileSync(probePath, withoutDirective);
    runTypecheckExpectingFailure({
      label: `${directive[1]} directive ${index + 1}/${directives.length}`,
    });
  }

  // A forged directive on a valid expression must itself fail as unused.
  writeFileSync(
    probePath,
    [
      'import { redirect } from "./index";',
      "// @ts-expect-error TYPE-TEETH-FORGE — this valid call must reject the directive.",
      'redirect("Home", {});',
      "",
    ].join("\n"),
  );
  runTypecheckExpectingFailure({
    label: "forged directive",
    expectedDiagnostic: "TS2578",
  });

  // TYPE-03's positive equality assertion must reject a config augmentation.
  const widenedActivityDefinitionKeys = source.replace(
    '"name" | "loader"',
    '"name" | "loader" | "guard"',
  );
  if (widenedActivityDefinitionKeys === source) {
    throw new Error("TYPE-03 ActivityDefinition key equality was not found");
  }
  writeFileSync(probePath, widenedActivityDefinitionKeys);
  runTypecheckExpectingFailure({
    label: "TYPE-03 key equality",
    expectedDiagnostic: "TS2322",
  });
} finally {
  if (existsSync(probePath)) {
    unlinkSync(probePath);
  }
}

process.stdout.write(
  `type negative controls: ${directives.length} directives + forged directive + TYPE-03 equality confirmed\n`,
);

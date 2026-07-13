import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const expectedTypeIds = [
  "TYPE-01",
  "TYPE-02",
  "TYPE-03",
  "TYPE-04",
  "TYPE-05",
  "TYPE-06",
  "TYPE-07",
  "TYPE-08",
  "TYPE-09",
];

const expectedRuntimeIds = [
  "API-01",
  "API-02",
  "GUARD-01",
  "GUARD-02",
  "ENTRY-PUSH-REDIRECT",
  "ENTRY-REPLACE-REDIRECT",
  "ENTRY-REDIRECT-OPTIONS",
  "ENTRY-REDIRECT-REGUARD",
  "ENTRY-REDIRECT-TARGET-ERROR",
  "ENTRY-ACTION-ERROR",
  "ENTRY-ATOMIC-OBSERVATION",
  "ENTRY-DEFAULT-INITIAL",
  "ENTRY-DEEP-LINK-INITIAL",
  "ENTRY-INITIAL-ERROR",
  "ENTRY-INITIAL-STEPS-ALLOW",
  "ENTRY-INITIAL-STEPS-REDIRECT",
  "ENTRY-MULTI-FRESH-EACH",
  "ENTRY-MULTI-FRESH-CANCEL",
  "ENTRY-SEQUENTIAL-EACH",
  "ENTRY-SEQUENTIAL-CANCEL",
  "ENTRY-CANCEL-SCOPE",
  "NONENTRY-REACTIVATION",
  "NONENTRY-LOAD",
  "ENTRY-AFTER-LOAD",
  "NONENTRY-STEPS",
  "AND-ALL-TRUE",
  "AND-FIRST-RESOLUTION",
  "OR-FIRST-TRUE",
  "OR-OTHERWISE",
  "COMBINATOR-ERROR",
  "ECO-LOADER-RENDER",
  "ECO-POST-EFFECT",
];

function sorted(values) {
  return [...values].sort();
}

function assertExact(label, actual, expected) {
  if (new Set(actual).size !== actual.length) {
    throw new Error(
      `${label} contains duplicate identifiers: ${actual.join(", ")}`,
    );
  }
  if (JSON.stringify(sorted(actual)) !== JSON.stringify(sorted(expected))) {
    throw new Error(
      `${label} mismatch\nactual: ${sorted(actual).join(", ")}\nexpected: ${sorted(expected).join(", ")}`,
    );
  }
}

const typeSource = readFileSync(
  path.join(packageDirectory, "src", "activityGuardPlugin.type-spec.ts"),
  "utf8",
);
const typeIds = [...typeSource.matchAll(/^\/\/ (TYPE-\d{2}) —/gm)].map(
  ([, id]) => id,
);

const runtimeSources = [
  "activityGuardPlugin.spec.ts",
  "activityGuardPlugin.react.spec.tsx",
  "combinators.spec.ts",
].map((file) => readFileSync(path.join(packageDirectory, "src", file), "utf8"));
const runtimeIds = runtimeSources.flatMap((source) =>
  [
    ...source.matchAll(
      /"((?:API|GUARD|ENTRY|NONENTRY|AND|OR|COMBINATOR|ECO)-[A-Z0-9-]+) —/g,
    ),
  ].map(([, id]) => id),
);

assertExact("type contract map", typeIds, expectedTypeIds);
assertExact("runtime contract map", runtimeIds, expectedRuntimeIds);

process.stdout.write(
  "contract map: 9 type + 32 runtime/integration identifiers confirmed\n",
);

import { coerceParamsToString } from "./coerceParamsToString";

test("coerceParamsToString - returns empty object when params is null", () => {
  expect(coerceParamsToString(null)).toStrictEqual({});
});

test("coerceParamsToString - returns empty object when params is undefined", () => {
  expect(coerceParamsToString(undefined)).toStrictEqual({});
});

test("coerceParamsToString - keeps string values unchanged", () => {
  expect(coerceParamsToString({ name: "hello", empty: "" })).toStrictEqual({
    name: "hello",
    empty: "",
  });
});

test("coerceParamsToString - coerces booleans to strings", () => {
  expect(coerceParamsToString({ visible: true, hidden: false })).toStrictEqual({
    visible: "true",
    hidden: "false",
  });
});

test("coerceParamsToString - coerces numbers to strings (including zero)", () => {
  expect(coerceParamsToString({ count: 5, zero: 0, neg: -1 })).toStrictEqual({
    count: "5",
    zero: "0",
    neg: "-1",
  });
});

test("coerceParamsToString - coerces bigint to string", () => {
  expect(coerceParamsToString({ big: BigInt(10) })).toStrictEqual({
    big: "10",
  });
});

test("coerceParamsToString - coerces symbol to string", () => {
  const sym = Symbol("foo");
  expect(coerceParamsToString({ sym })).toStrictEqual({
    sym: String(sym),
  });
});

test("coerceParamsToString - preserves undefined values", () => {
  expect(coerceParamsToString({ opt: undefined })).toStrictEqual({
    opt: undefined,
  });
});

test("coerceParamsToString - converts null values to undefined", () => {
  expect(coerceParamsToString({ opt: null })).toStrictEqual({
    opt: undefined,
  });
});

test("coerceParamsToString - stringifies plain objects via JSON.stringify", () => {
  expect(
    coerceParamsToString({ filter: { category: "tech", count: 3 } }),
  ).toStrictEqual({
    filter: '{"category":"tech","count":3}',
  });
});

test("coerceParamsToString - stringifies arrays via JSON.stringify", () => {
  expect(coerceParamsToString({ tags: ["js", "ts"] })).toStrictEqual({
    tags: '["js","ts"]',
  });
});

test("coerceParamsToString - handles circular references without throwing", () => {
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  const result = coerceParamsToString({ circular });
  // When JSON.stringify fails, fall back to String()
  expect(typeof result.circular).toBe("string");
  expect(result.circular).toBe(String(circular));
});

test("coerceParamsToString - coerces functions", () => {
  const fn = () => "hello";
  const result = coerceParamsToString({ fn });
  expect(typeof result.fn).toBe("string");
});

test("coerceParamsToString - handles nested objects with undefined values", () => {
  expect(
    coerceParamsToString({ outer: { inner: undefined, value: 1 } }),
  ).toStrictEqual({
    outer: '{"value":1}',
  });
});

test("coerceParamsToString - handles mixed types", () => {
  expect(
    coerceParamsToString({
      a: true,
      b: 5,
      c: "x",
      d: undefined,
      e: null,
    }),
  ).toStrictEqual({
    a: "true",
    b: "5",
    c: "x",
    d: undefined,
    e: undefined,
  });
});

test("coerceParamsToString - is idempotent for all covered input types", () => {
  const sym = Symbol("foo");
  const fn = () => "hello";
  const circular: Record<string, unknown> = {};
  circular.self = circular;

  const input = {
    str: "x",
    emptyStr: "",
    boolT: true,
    boolF: false,
    num: 5,
    zero: 0,
    neg: -1,
    big: BigInt(10),
    sym,
    undef: undefined,
    nullVal: null,
    obj: { a: 1, b: [1, 2] },
    arr: ["js", "ts"],
    fn,
    circular,
  };

  const once = coerceParamsToString(input);
  const twice = coerceParamsToString(once);

  expect(twice).toStrictEqual(once);
});

test("coerceParamsToString - handles a 1000-key record with mixed types: spot-checks every cycle branch with typeof assertions (T-U3)", () => {
  // Replaces the previous length-only assertion with branch-spot-checks so a
  // regression that turns one of the 5 branches into a no-op (e.g. dropping
  // the string-passthrough or the object JSON.stringify) is now caught.
  const input: Record<string, unknown> = {};
  for (let i = 0; i < 1000; i++) {
    switch (i % 5) {
      case 0:
        input[`k${i}`] = `v${i}`;
        break;
      case 1:
        input[`k${i}`] = i;
        break;
      case 2:
        input[`k${i}`] = i % 2 === 0;
        break;
      case 3:
        input[`k${i}`] = { idx: i };
        break;
      default:
        input[`k${i}`] = undefined;
    }
  }

  const result = coerceParamsToString(input);

  expect(Object.keys(result)).toHaveLength(1000);

  // Branch 0 (string passthrough): k0 = "v0"
  expect(result.k0).toEqual("v0");
  expect(typeof result.k0).toEqual("string");

  // Branch 1 (number → String()): k1 = "1"
  expect(result.k1).toEqual("1");
  expect(typeof result.k1).toEqual("string");

  // Branch 2 (boolean → String()): k2 = "true" (i=2 → 2%2===0 → true)
  expect(result.k2).toEqual("true");
  expect(typeof result.k2).toEqual("string");

  // Branch 3 (object → JSON.stringify): k3 = '{"idx":3}'
  expect(result.k3).toEqual('{"idx":3}');
  expect(typeof result.k3).toEqual("string");

  // Branch 4 (undefined): k4 stays undefined (value-equality only)
  expect(result.k4).toBeUndefined();
});

test("coerceParamsToString - Date object goes through JSON.stringify (uses Date.prototype.toJSON, NOT '{}') (T-U1)", () => {
  // SURPRISE FINDING: the plan predicted `'{}'`, but `Date` overrides
  // `toJSON()` to produce its ISO string. `JSON.stringify(new Date(...))`
  // therefore returns `'"<ISO>"'` (a JSON-encoded string, with surrounding
  // double-quotes), NOT `'{}'`. This documents the actual behavior so a
  // future change to Date or to the `typeof === "object"` branch would be
  // caught.
  const d = new Date("2026-04-28T00:00:00.000Z");
  const result = coerceParamsToString({ d });
  expect(result.d).toEqual('"2026-04-28T00:00:00.000Z"');
  expect(typeof result.d).toEqual("string");
});

test("coerceParamsToString - Map and Set go through JSON.stringify and produce '{}' (NOT String() fallback) (T-U2)", () => {
  // SURPRISE FINDING: the plan predicted Map/Set would fall back to
  // `String(v)` and yield `"[object Map]"` / `"[object Set]"`. They do NOT.
  // `Map` / `Set` are objects, so the `typeof === "object"` branch runs
  // first and `JSON.stringify` returns the literal string `"{}"` (because
  // the default JSON serialization of a Map/Set has no enumerable own
  // properties). The `String(v)` fallback is only reached when
  // `JSON.stringify` returns `undefined` (e.g. for a top-level `undefined`
  // — which is filtered out earlier — or a top-level `function`, which
  // hits the catch path via `String(value)` only when the typeof branch's
  // returned value isn't a string). Documenting actual behavior:
  const m = new Map([["a", 1]]);
  const s = new Set([1, 2, 3]);
  const result = coerceParamsToString({ m, s });
  expect(result.m).toEqual("{}");
  expect(result.s).toEqual("{}");
  expect(typeof result.m).toEqual("string");
  expect(typeof result.s).toEqual("string");
});

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

test("coerceParamsToString - handles a 1000-key record with mixed types without throwing", () => {
  const input: Record<string, unknown> = {};
  for (let i = 0; i < 1000; i++) {
    // Cycle through several input types so we exercise more than the string branch.
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
});

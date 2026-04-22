import { coerceParamsToString } from "./coerceParamsToString";

describe("coerceParamsToString", () => {
  test("returns empty object when params is null", () => {
    expect(coerceParamsToString(null)).toStrictEqual({});
  });

  test("returns empty object when params is undefined", () => {
    expect(coerceParamsToString(undefined)).toStrictEqual({});
  });

  test("keeps string values unchanged", () => {
    expect(coerceParamsToString({ name: "hello", empty: "" })).toStrictEqual({
      name: "hello",
      empty: "",
    });
  });

  test("coerces booleans to strings", () => {
    expect(
      coerceParamsToString({ visible: true, hidden: false }),
    ).toStrictEqual({
      visible: "true",
      hidden: "false",
    });
  });

  test("coerces numbers to strings (including zero)", () => {
    expect(coerceParamsToString({ count: 5, zero: 0, neg: -1 })).toStrictEqual({
      count: "5",
      zero: "0",
      neg: "-1",
    });
  });

  test("coerces bigint to string", () => {
    expect(coerceParamsToString({ big: BigInt(10) })).toStrictEqual({
      big: "10",
    });
  });

  test("coerces symbol to string", () => {
    const sym = Symbol("foo");
    expect(coerceParamsToString({ sym })).toStrictEqual({
      sym: String(sym),
    });
  });

  test("preserves undefined values", () => {
    expect(coerceParamsToString({ opt: undefined })).toStrictEqual({
      opt: undefined,
    });
  });

  test("converts null values to undefined", () => {
    expect(coerceParamsToString({ opt: null })).toStrictEqual({
      opt: undefined,
    });
  });

  test("stringifies plain objects via JSON.stringify", () => {
    expect(
      coerceParamsToString({ filter: { category: "tech", count: 3 } }),
    ).toStrictEqual({
      filter: '{"category":"tech","count":3}',
    });
  });

  test("stringifies arrays via JSON.stringify", () => {
    expect(coerceParamsToString({ tags: ["js", "ts"] })).toStrictEqual({
      tags: '["js","ts"]',
    });
  });

  test("handles circular references without throwing", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const result = coerceParamsToString({ circular });
    // When JSON.stringify fails, fall back to String()
    expect(typeof result.circular).toBe("string");
    expect(result.circular).toBe(String(circular));
  });

  test("coerces functions", () => {
    const fn = () => "hello";
    const result = coerceParamsToString({ fn });
    expect(typeof result.fn).toBe("string");
  });

  test("handles nested objects with undefined values", () => {
    expect(
      coerceParamsToString({ outer: { inner: undefined, value: 1 } }),
    ).toStrictEqual({
      outer: '{"value":1}',
    });
  });

  test("handles mixed types", () => {
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
});

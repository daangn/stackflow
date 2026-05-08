import { makeTemplate } from "./makeTemplate";

test("makeTemplate - 패스 파라미터만 있을 때는 패스 파라미터로 붙입니다", () => {
  const template = makeTemplate({ path: "/articles/:articleId" });

  expect(
    template.fill({
      articleId: "1234",
    }),
  ).toEqual("/articles/1234/");
});

test("makeTemplate - 패스 파라미터에 추가 파라미터가 주어질 때는 쿼리 파라미터로 붙입니다", () => {
  const template = makeTemplate({ path: "/articles/:articleId" });

  expect(
    template.fill({
      articleId: "1234",
      title: "hello",
    }),
  ).toEqual("/articles/1234/?title=hello");
});

test("makeTemplate - 추가 파라미터만 있을 때는 모두 쿼리 파라미터로 붙입니다", () => {
  const template = makeTemplate({ path: "/home/" });

  expect(
    template.fill({
      articleId: "1234",
      title: "hello",
    }),
  ).toEqual("/home/?articleId=1234&title=hello");
});

test("makeTemplate - 패스가 같으면 빈 객체를 내려줍니다", () => {
  const template = makeTemplate({ path: "/articles/" });

  expect(template.parse("/articles/")).toStrictEqual({});
});

test("makeTemplate - 패스가 다르면 null을 내려줍니다", () => {
  const template = makeTemplate({ path: "/articles/" });

  expect(template.parse("/not-articles/")).toEqual(null);
});

test("makeTemplate - 패스 파라미터와 쿼리 파라미터를 적절하게 파싱합니다", () => {
  const template = makeTemplate({ path: "/articles/:articleId" });

  expect(template.parse("/articles/1234/?title=hello")).toStrictEqual({
    articleId: "1234",
    title: "hello",
  });
});

test("makeTemplate - 패스 파라미터에 `undefined` 값이 포함된 경우 삭제합니다", () => {
  const template = makeTemplate({ path: "/articles" });

  expect(
    template.fill({
      articleId: "1234",
      test: undefined,
    }),
  ).toEqual("/articles/?articleId=1234");
});

test("makeTemplate - parse with given decode function", () => {
  const template = makeTemplate({
    path: "/articles/:articleId",
    decode: ({ articleId }) => ({
      articleId: Number(articleId),
    }),
  });

  expect(template.parse("/articles/1234")).toStrictEqual({
    articleId: 1234,
  });
});

test("makeTemplate - fill with encode function using JSON.stringify for object params", () => {
  const template = makeTemplate({
    path: "/search",
    encode: (params) => ({
      filter: JSON.stringify(params.filter),
    }),
  });

  expect(
    template.fill({
      filter: { category: "tech", tags: ["javascript", "react"] },
    }),
  ).toEqual(
    "/search/?filter=%7B%22category%22%3A%22tech%22%2C%22tags%22%3A%5B%22javascript%22%2C%22react%22%5D%7D",
  );
});

test("makeTemplate - fill still calls encode with typed params (not pre-stringified)", () => {
  const encode = jest.fn((params: Record<string, any>) => ({
    visible: params.visible ? "y" : "n",
  }));
  const template = makeTemplate({
    path: "/toggle",
    encode,
  });

  const url = template.fill({ visible: true });

  expect(encode).toHaveBeenCalledTimes(1);
  // The boolean is preserved into encode — not pre-stringified to "true".
  expect(encode).toHaveBeenCalledWith({ visible: true });
  expect(url).toEqual("/toggle/?visible=y");
});

test("makeTemplate - fillWithoutEncode skips encode entirely", () => {
  const encode = jest.fn((params: Record<string, any>) => ({
    visible: params.visible ? "y" : "n",
  }));
  const template = makeTemplate({
    path: "/toggle",
    encode,
  });

  const url = template.fillWithoutEncode({ visible: "true" });

  expect(encode).not.toHaveBeenCalled();
  expect(url).toEqual("/toggle/?visible=true");
});

test("makeTemplate - fillWithoutEncode interpolates path params", () => {
  const template = makeTemplate({ path: "/articles/:articleId" });

  expect(
    template.fillWithoutEncode({
      articleId: "1234",
      title: "hello",
    }),
  ).toEqual("/articles/1234/?title=hello");
});

test("makeTemplate - fillWithoutEncode drops undefined values", () => {
  const template = makeTemplate({ path: "/articles" });

  expect(
    template.fillWithoutEncode({
      articleId: "1234",
      test: undefined,
    }),
  ).toEqual("/articles/?articleId=1234");
});

test("makeTemplate - fill and fillWithoutEncode diverge under NON-IDENTITY encode (fillWithoutEncode does NOT call encode) (T-M1)", () => {
  // Replaces the previous vacuous identity-encode parity test. Identity
  // encode makes the two paths trivially equal regardless of whether
  // `fillWithoutEncode` skips encode or not — so the test couldn't catch
  // a regression that made `fillWithoutEncode` accidentally call encode.
  // Non-identity encode (boolean → "y"/"n") proves the contract: encode
  // mutates the URL when called, so its absence is observable.
  const encode = jest.fn((params: Record<string, any>) => ({
    articleId: String(params.articleId),
    visible: params.visible ? "y" : "n",
  }));
  const template = makeTemplate({
    path: "/articles/:articleId",
    encode,
  });

  // fillWithoutEncode receives already-stringified params and MUST skip encode.
  const urlWithoutEncode = template.fillWithoutEncode({
    articleId: "1234",
    visible: "true",
  });
  expect(encode).not.toHaveBeenCalled();
  expect(urlWithoutEncode).toEqual("/articles/1234/?visible=true");

  // fill on the typed equivalent calls encode and produces a DIFFERENT URL.
  encode.mockClear();
  const urlWithEncode = template.fill({ articleId: "1234", visible: true });
  expect(encode).toHaveBeenCalledTimes(1);
  expect(urlWithEncode).toEqual("/articles/1234/?visible=y");

  // The two URLs MUST diverge — proving the test is not vacuous.
  expect(urlWithoutEncode).not.toEqual(urlWithEncode);
});

test("makeTemplate - fill(typed) === fillWithoutEncode(coerced(encode(typed))) — non-identity drift theorem (T-M1)", () => {
  // Replaces the second vacuous identity-encode parity test. With a
  // non-identity encode, `fill(typed)` must equal building a URL from the
  // already-encoded-and-then-stringified store params via
  // `fillWithoutEncode`. This is the round-trip property FEP-1061 relies
  // on for `onPushed` to reproduce the same URL using the coerced store
  // params.
  const encode = jest.fn((params: Record<string, any>) => ({
    articleId: String(params.articleId),
    visible: params.visible ? "y" : "n",
  }));
  const template = makeTemplate({
    path: "/articles/:articleId",
    encode,
  });

  const typed = { articleId: "1234", visible: true };
  const fillUrl = template.fill(typed);

  // Mirror what FEP-1061 does at runtime: encode runs on the typed params,
  // then the encoded values are coerced (here they are already strings,
  // but we exercise the same shape `fillWithoutEncode` would receive from
  // the store).
  const encoded = encode(typed);
  encode.mockClear();
  const fillWithoutEncodeUrl = template.fillWithoutEncode(encoded);

  // fillWithoutEncode must NOT have called encode again.
  expect(encode).not.toHaveBeenCalled();
  // Both paths must yield the same URL.
  expect(fillUrl).toEqual(fillWithoutEncodeUrl);
});

test("makeTemplate - fillWithoutEncode with empty-string value drops the key from the URL query (falsy guard in _buildUrl)", () => {
  // `_buildUrl` has a `value ? { [key]: value } : null` reducer which treats
  // "" as falsy and therefore omits the key from the search params entirely.
  // This test documents that empty strings are NOT written to the URL query,
  // even though they are valid `string` values in the store.
  const template = makeTemplate({ path: "/articles" });

  expect(
    template.fillWithoutEncode({
      articleId: "1234",
      empty: "",
    }),
  ).toEqual("/articles/?articleId=1234");
});

test("makeTemplate - fill propagates synchronous errors from user-supplied encode (does not catch)", () => {
  const template = makeTemplate({
    path: "/toggle",
    encode: () => {
      throw new Error("encode boom");
    },
  });

  // `fill` does not wrap `encode` in try/catch — user errors propagate.
  expect(() => template.fill({ visible: true })).toThrow("encode boom");
});

test("makeTemplate - parse with custom decode receives raw URL strings unchanged (decode input is pre-coercion)", () => {
  const decode = jest.fn((params: Record<string, string | undefined>) => ({
    articleId: params.articleId,
    enabled: params.enabled === "y",
  }));
  const template = makeTemplate({
    path: "/articles/:articleId",
    decode,
  });

  template.parse("/articles/1234/?enabled=y&empty=");

  // `decode` must be called with the raw URL-derived strings — no prior
  // type coercion. The empty-string value from the query is preserved as "".
  expect(decode).toHaveBeenCalledTimes(1);
  expect(decode).toHaveBeenCalledWith({
    articleId: "1234",
    enabled: "y",
    empty: "",
  });
});

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

test("makeTemplate - fill and fillWithoutEncode produce identical URLs with identity encode", () => {
  const template = makeTemplate({
    path: "/articles/:articleId",
    encode: (params: Record<string, any>) =>
      params as Record<string, string | undefined>,
  });

  const stringParams = { articleId: "1234", title: "hello" };

  expect(template.fill(stringParams)).toEqual(
    template.fillWithoutEncode(stringParams),
  );
});

test("makeTemplate - fill + identity-encode equals fillWithoutEncode(stringified)", () => {
  const template = makeTemplate({
    path: "/articles/:articleId",
    encode: (params: Record<string, any>) =>
      params as Record<string, string | undefined>,
  });

  // encode is identity, so fillWithoutEncode of the same strings must match
  expect(template.fill({ articleId: "1234", count: "5" })).toEqual(
    template.fillWithoutEncode({ articleId: "1234", count: "5" }),
  );
});

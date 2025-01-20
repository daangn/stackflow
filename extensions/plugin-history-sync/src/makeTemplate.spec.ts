import { makeTemplate } from "./makeTemplate";

test("makeTemplate - 패스 파라미터만 있을 때는 패스 파라미터로 붙입니다", () => {
  const template = makeTemplate({
    activityName: "Article",
    path: "/articles/:articleId",
  });

  expect(
    template.fill({
      articleId: "1234",
    }),
  ).toEqual("/articles/1234/");
});

test("makeTemplate - 패스 파라미터에 추가 파라미터가 주어질 때는 쿼리 파라미터로 붙입니다", () => {
  const template = makeTemplate({
    activityName: "Article",
    path: "/articles/:articleId",
  });

  expect(
    template.fill({
      articleId: "1234",
      title: "hello",
    }),
  ).toEqual("/articles/1234/?title=hello");
});

test("makeTemplate - 추가 파라미터만 있을 때는 모두 쿼리 파라미터로 붙입니다", () => {
  const template = makeTemplate({
    activityName: "Article",
    path: "/home/",
  });

  expect(
    template.fill({
      articleId: "1234",
      title: "hello",
    }),
  ).toEqual("/home/?articleId=1234&title=hello");
});

test("makeTemplate - 패스가 같으면 빈 객체를 내려줍니다", () => {
  const template = makeTemplate({
    activityName: "Article",
    path: "/articles/",
  });

  expect(template.parse("/articles/")).toStrictEqual({});
});

test("makeTemplate - 패스가 다르면 null을 내려줍니다", () => {
  const template = makeTemplate({
    activityName: "Article",
    path: "/articles/",
  });

  expect(template.parse("/not-articles/")).toEqual(null);
});

test("makeTemplate - 패스 파라미터와 쿼리 파라미터를 적절하게 파싱합니다", () => {
  const template = makeTemplate({
    activityName: "Article",
    path: "/articles/:articleId",
  });

  expect(template.parse("/articles/1234/?title=hello")).toStrictEqual({
    articleId: "1234",
    title: "hello",
  });
});

test("makeTemplate - 패스 파라미터에 `undefined` 값이 포함된 경우 삭제합니다", () => {
  const template = makeTemplate({
    activityName: "Article",
    path: "/articles",
  });

  expect(
    template.fill({
      articleId: "1234",
      test: undefined,
    }),
  ).toEqual("/articles/?articleId=1234");
});

test("makeTemplate - parse with given decode function", () => {
  const template = makeTemplate({
    activityName: "Article",
    path: "/articles/:articleId",
    decode: ({ articleId }) => ({
      articleId: Number(articleId),
    }),
  });

  expect(template.parse("/articles/1234")).toStrictEqual({
    articleId: 1234,
  });
});

test("makeTemplate - If no path is given, the default path is `/.activities/*`.", () => {
  const template = makeTemplate({
    activityName: "Article",
    path: undefined as any,
    decode: ({ articleId }) => ({
      articleId: Number(articleId),
    }),
  });

  expect(
    template.fill({
      articleId: "1234",
      title: "hello",
    }),
  ).toEqual("/.activities/Article/?articleId=1234&title=hello");
});

import { sortRoutes } from "./sortRoutes";

test("sortRoutes - 우선순위가 높은 라우트가 먼저 놓여집니다", () => {
  const routes = sortRoutes({
    B: "/hello/:param",
    A: "/hello/world",
  });

  expect(routes).toStrictEqual([
    { activityName: "A", templateStr: "/hello/world" },
    { activityName: "B", templateStr: "/hello/:param" },
  ]);
});

test("sortRoutes - 한 액티비티가 여러 라우트를 가지는 경우, 여러번 route에 등록됩니다", () => {
  const routes = sortRoutes({
    B: ["/hello/:param", "/hello/second"],
    A: "/hello/world",
  });

  expect(routes).toStrictEqual([
    { activityName: "B", templateStr: "/hello/second" },
    { activityName: "A", templateStr: "/hello/world" },
    { activityName: "B", templateStr: "/hello/:param" },
  ]);
});

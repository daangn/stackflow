import { sortActivityRoutes } from "./sortActivityRoutes";

test("sortActivityRoutes - 우선순위가 높은 라우트가 먼저 놓여집니다", () => {
  const routes = sortActivityRoutes([
    { activityName: "B", path: "/hello/:param" },
    { activityName: "A", path: "/hello/world" },
  ]);

  expect(routes).toStrictEqual([
    { activityName: "A", path: "/hello/world" },
    { activityName: "B", path: "/hello/:param" },
  ]);
});

test("sortActivityRoutes - 한 액티비티가 여러 라우트를 가지는 경우, 여러번 route에 등록됩니다", () => {
  const routes = sortActivityRoutes([
    { activityName: "B", path: "/hello/:param" },
    { activityName: "B", path: "/hello/second" },
    { activityName: "A", path: "/hello/world" },
  ]);

  expect(routes).toStrictEqual([
    { activityName: "B", path: "/hello/second" },
    { activityName: "A", path: "/hello/world" },
    { activityName: "B", path: "/hello/:param" },
  ]);
});

test("sortActivityRoutes - *이 들어간 경우 해당 라우트를 맨 뒤로 옮깁니다", () => {
  const routes = sortActivityRoutes([
    { activityName: "A", path: "*" },
    { activityName: "A", path: "/detailed/*" },
    { activityName: "B", path: "/:hello/:world" },
    { activityName: "C", path: "/:hello/:world/:foo/:bar" },
  ]);

  expect(routes).toStrictEqual([
    { activityName: "C", path: "/:hello/:world/:foo/:bar" },
    { activityName: "A", path: "/detailed/*" },
    { activityName: "B", path: "/:hello/:world" },
    { activityName: "A", path: "*" },
  ]);
});

test("sortActivityRoutes - priority가 있는 경우 priority가 동일한 라우트들 간에 정렬됩니다", () => {
  const routes = sortActivityRoutes([
    { activityName: "A", path: "*" },
    { activityName: "A", path: "/detailed/*" },
    { activityName: "B", path: "/:hello/:world" },
    { activityName: "C", path: "/:hello/:world/:foo/:bar" },
    { activityName: "A", priority: 1, path: "*" },
    { activityName: "A", priority: 1, path: "/detailed/*" },
    { activityName: "B", priority: 1, path: "/:hello/:world" },
    { activityName: "C", priority: 1, path: "/:hello/:world/:foo/:bar" },
    { activityName: "A", priority: -1, path: "*" },
    { activityName: "A", priority: -1, path: "/detailed/*" },
    { activityName: "B", priority: -1, path: "/:hello/:world" },
    { activityName: "C", priority: -1, path: "/:hello/:world/:foo/:bar" },
  ]);

  expect(routes).toStrictEqual([
    { activityName: "C", priority: 1, path: "/:hello/:world/:foo/:bar" },
    { activityName: "A", priority: 1, path: "/detailed/*" },
    { activityName: "B", priority: 1, path: "/:hello/:world" },
    { activityName: "A", priority: 1, path: "*" },
    { activityName: "C", path: "/:hello/:world/:foo/:bar" },
    { activityName: "A", path: "/detailed/*" },
    { activityName: "B", path: "/:hello/:world" },
    { activityName: "A", path: "*" },
    { activityName: "C", priority: -1, path: "/:hello/:world/:foo/:bar" },
    { activityName: "A", priority: -1, path: "/detailed/*" },
    { activityName: "B", priority: -1, path: "/:hello/:world" },
    { activityName: "A", priority: -1, path: "*" },
  ]);
});

import { normalizeActivityRouteMap } from "./normalizeActivityRouteMap";

test("normalizeActivityRouteMap", () => {
  expect(
    normalizeActivityRouteMap({
      Hello: ["/hello", "/hello-2"],
      World: "/world",
    }),
  ).toStrictEqual([
    {
      activityName: "Hello",
      path: "/hello",
    },
    {
      activityName: "Hello",
      path: "/hello-2",
    },
    {
      activityName: "World",
      path: "/world",
    },
  ]);
});

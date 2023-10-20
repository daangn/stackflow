import { normalizeRoute } from "./normalizeRoute";

test("normalizeRoute - string이 들어오면 [Route]으로 만듭니다", () => {
  expect(normalizeRoute("/home")).toEqual([
    {
      path: "/home",
    },
  ]);
});

test("normalizeRoute - string[]이 들어오면 Route[]인채로 반환합니다", () => {
  expect(normalizeRoute(["/home"])).toEqual([
    {
      path: "/home",
    },
  ]);
});

test("normalizeRoute - Route가 들어오면 Route[]로 만듭니다", () => {
  expect(normalizeRoute({ path: "/home" })).toEqual([{ path: "/home" }]);
});

test("normalizeRoute - Route[]가 들어오면 Route[]인채로 반환합니다", () => {
  expect(normalizeRoute([{ path: "/home" }])).toEqual([{ path: "/home" }]);
});

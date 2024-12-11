import { normalizeRouteInput } from "./normalizeRouteInput";

test("normalizeRoute - string이 들어오면 [Route]으로 만듭니다", () => {
  expect(normalizeRouteInput("/home")).toEqual([
    {
      path: "/home",
    },
  ]);
});

test("normalizeRoute - string[]이 들어오면 Route[]인채로 반환합니다", () => {
  expect(normalizeRouteInput(["/home"])).toEqual([
    {
      path: "/home",
    },
  ]);
});

test("normalizeRoute - Route가 들어오면 Route[]로 만듭니다", () => {
  expect(normalizeRouteInput({ path: "/home" })).toEqual([{ path: "/home" }]);
});

test("normalizeRoute - Route[]가 들어오면 Route[]인채로 반환합니다", () => {
  expect(normalizeRouteInput([{ path: "/home" }])).toEqual([{ path: "/home" }]);
});

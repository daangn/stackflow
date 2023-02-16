import { normalizeRoute } from "./normalizeRoute";

test("normalizeRoute - string이 들어오면 [string]으로 만듭니다", () => {
  expect(normalizeRoute("/home")).toEqual(["/home"]);
});

test("normalizeRoute - string[]이 들어오면 string[]인채로 반환합니다", () => {
  expect(normalizeRoute(["/home"])).toEqual(["/home"]);
});

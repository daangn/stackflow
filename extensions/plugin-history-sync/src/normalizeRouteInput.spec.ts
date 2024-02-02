import { normalizeRouteInput } from "./normalizeRouteInput";

test("normalizeRouteInput - string이 들어오면 [string]으로 만듭니다", () => {
  expect(normalizeRouteInput("/home")).toEqual(["/home"]);
});

test("normalizeRouteInput - string[]이 들어오면 string[]인채로 반환합니다", () => {
  expect(normalizeRouteInput(["/home"])).toEqual(["/home"]);
});

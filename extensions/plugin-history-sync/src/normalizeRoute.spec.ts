import { normalizeRoute } from "./normalizeRoute";

test("normalizeRoute - string", () => {
  expect(normalizeRoute("/home")).toEqual(["/home"]);
});

test("normalizeRoute - array", () => {
  expect(normalizeRoute(["/home"])).toEqual(["/home"]);
});

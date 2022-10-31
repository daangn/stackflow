import { last } from "./last";

test("last", () => {
  expect(
    last([{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }]),
  ).toStrictEqual({ id: "4" });

  expect(last([])).toStrictEqual(undefined);
});

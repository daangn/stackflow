import { findIndices } from "./findIndices";

test("findIndices", () => {
  expect(
    findIndices(
      [{ id: "1" }, { id: "2" }, { id: "1" }, { id: "2" }],
      (e) => e.id === "1",
    ),
  ).toStrictEqual([0, 2]);
});

import { last } from "./last";

test("last - 아무것도 없는 경우 undefined를 반환합니다", () => {
  expect(last([])).toEqual(undefined);
});

test("last - 마지막 element를 반환합니다", () => {
  expect(last([1, 2, 3])).toEqual(3);
});

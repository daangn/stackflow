import { uniqBy } from "./uniqBy";

test("uniqBy - 중복된 아이템이 없는 경우, 그대로 내려줍니다", () => {
  expect(uniqBy([1, 2, 3], (i) => String(i))).toStrictEqual([1, 2, 3]);
});

test("uniqBy - 중복된 아이템이 있는 경우 앞에 아이템을 삭제하고 뒤 아이템을 취합니다", () => {
  expect(
    uniqBy(
      [
        {
          a: 1,
          c: 3,
        },
        { b: 2, c: 2 },
        { c: 3, d: 4 },
      ],
      (i) => String(i.c),
    ),
  ).toStrictEqual([
    { b: 2, c: 2 },
    { c: 3, d: 4 },
  ]);
});

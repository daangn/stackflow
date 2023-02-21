import merge from "./merge";

test("merge test", () => {
  const result = merge(
    {
      a: {
        $value: true,
      },
    },
    {
      a: {
        $opened: true,
      },
    },
  );

  expect(result).toEqual({
    a: {
      $value: true,
      $opened: true,
    },
  });
});

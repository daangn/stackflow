import diff from "./diff";

test("diff test - key", () => {
  const result = diff(
    {
      a: {},
    },
    {
      a: {
        aa: {
          aaa: 1,
        },
      },
    },
  );

  expect(result).toEqual({
    a: {
      aa: {
        $key: true,
      },
    },
  });
});

test("diff test - value", () => {
  const result = diff(
    {
      a: 1,
    },
    {
      a: {
        aa: {
          aaa: 1,
        },
      },
    },
  );

  expect(result).toEqual({
    a: {
      $value: true,
    },
  });
});

test("diff test - key (array)", () => {
  const result = diff(
    {
      a: ["a", "b", "c"],
    },
    {
      a: ["a", "b", "c", "d"],
    },
  );

  expect(result).toEqual({
    a: {
      3: {
        $key: true,
      },
    },
  });
});

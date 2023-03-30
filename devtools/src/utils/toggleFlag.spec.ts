import toggleFlag from "./toggleFlag";

test("test toggle open: undefined -> true", () => {
  expect(
    toggleFlag(
      {
        Stack: {
          activities: {
            0: {
              enteredBy: {
                $opened: true,
              },
            },
          },
          $opened: true,
        },
      },
      ["Stack", "activities", "0"],
      "$opened",
    ),
  ).toStrictEqual({
    Stack: {
      activities: {
        0: {
          enteredBy: {
            $opened: true,
          },
          $opened: true,
        },
      },
      $opened: true,
    },
  });
});

test("test toggle open: true -> false", () => {
  expect(
    toggleFlag(
      {
        Stack: {
          activities: {
            0: {
              enteredBy: {
                $opened: true,
              },
            },
          },
          $opened: true,
        },
      },
      ["Stack", "activities", "0", "enteredBy"],
      "$opened",
    ),
  ).toStrictEqual({
    Stack: {
      activities: {
        0: {
          enteredBy: {
            $opened: false,
          },
        },
      },
      $opened: true,
    },
  });
});

test("test toggle open: new keys", () => {
  expect(
    toggleFlag(
      {
        Stack: {
          $opened: true,
        },
      },
      ["Stack", "activities", "0", "enteredBy"],
      "$opened",
    ),
  ).toStrictEqual({
    Stack: {
      activities: {
        0: {
          enteredBy: {
            $opened: true,
          },
        },
      },
      $opened: true,
    },
  });
});

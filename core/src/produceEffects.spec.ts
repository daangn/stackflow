import { produceEffects } from "./produceEffects";

test("differences - 알 수 없는 이유로 두 object가 다르다면, %SOMETHING_CHANGED%를 결과로 포함합니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "2",
            name: "hello",
            transitionState: "enter-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
  ]);
});

test("differences - 새로운 액티비티가 추가되었다면, PUSHED 이펙트를 결과로 포함합니다", () => {
  expect(
    produceEffects(
      {
        activities: [],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "PUSHED",
      activity: {
        id: "1",
        name: "hello",
        transitionState: "enter-active",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    },
  ]);
});

test("differences - 여러개 액티비티가 추가되었다면, PUSHED 이펙트가 순서대로 추가됩니다", () => {
  expect(
    produceEffects(
      {
        activities: [],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "PUSHED",
      activity: {
        id: "1",
        name: "hello",
        transitionState: "enter-active",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
    },
    {
      _TAG: "PUSHED",
      activity: {
        id: "2",
        name: "hello",
        transitionState: "enter-active",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
    },
  ]);
});

test("differences - 액티비티 상태가 exit-active로 변한 액티비티가 있다면, POPPED 이펙트가 추가됩니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: true,
            zIndex: 1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "POPPED",
      activity: {
        id: "2",
        name: "hello",
        transitionState: "exit-active",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        zIndex: 1,
      },
    },
  ]);
});

test("differences - 액티비티 상태가 exit-active로 변한 액티비티가 여러개 있다면, POPPED 이펙트가 액티비티가 쌓인 zOrder와 반대로 추가됩니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "exit-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: true,
            zIndex: 1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "POPPED",
      activity: {
        id: "2",
        name: "hello",
        transitionState: "exit-active",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        zIndex: 1,
      },
    },
    {
      _TAG: "POPPED",
      activity: {
        id: "1",
        name: "hello",
        transitionState: "exit-active",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
    },
  ]);
});

test("differences - PushedEvent로 인해 액티비티 상태가 enter-active로 변한 액티비티가 있다면, PUSHED 이펙트가 추가됩니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: -1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "PUSHED",
      activity: {
        id: "2",
        name: "hello",
        transitionState: "enter-active",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
    },
  ]);
});

test("differences - Replaced 이벤트로 인해 액티비티 상태가 enter-active로 변한 액티비티가 있다면, REPLACED 이펙트가 추가됩니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: -1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: -1,
          },
          {
            id: "3",
            name: "hello",
            transitionState: "enter-active",
            params: {},
            pushedBy: {
              name: "Replaced",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "REPLACED",
      activity: {
        id: "3",
        name: "hello",
        transitionState: "enter-active",
        params: {},
        pushedBy: {
          name: "Replaced",
        } as any,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
    },
  ]);
});

test("differences - Replaced 이벤트에 같은 activityId를 넘겨주어 액티비티 상태가 변한 액티비티가 있다면, REPLACED 이펙트가 추가됩니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Replaced",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "REPLACED",
      activity: {
        id: "2",
        name: "hello",
        transitionState: "enter-done",
        params: {},
        pushedBy: {
          name: "Replaced",
        } as any,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
    },
  ]);
});

test("differences - NestedPushed가 작동해 nestedPushedBy가 늘어난 경우, NESTED_PUSHED 이펙트를 추가합니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            nestedRoutes: [
              {
                pushedBy: {
                  name: "NestedPushed",
                },
              } as any,
              {
                pushedBy: {
                  name: "NestedPushed",
                },
              } as any,
            ],
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "NESTED_PUSHED",
      activity: {
        id: "1",
        name: "hello",
        transitionState: "enter-done",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        nestedRoutes: [
          {
            pushedBy: {
              name: "NestedPushed",
            },
          } as any,
          {
            pushedBy: {
              name: "NestedPushed",
            },
          } as any,
        ],
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      activityNestedRoute: {
        pushedBy: {
          name: "NestedPushed",
        },
      } as any,
    },
    {
      _TAG: "NESTED_PUSHED",
      activity: {
        id: "1",
        name: "hello",
        transitionState: "enter-done",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        nestedRoutes: [
          {
            pushedBy: {
              name: "NestedPushed",
            },
          } as any,
          {
            pushedBy: {
              name: "NestedPushed",
            },
          } as any,
        ],
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      activityNestedRoute: {
        pushedBy: {
          name: "NestedPushed",
        },
      } as any,
    },
  ]);
});

test("differences - NestedReplaced가 작동해 nestedPushedBy가 늘어난 경우, NESTED_REPLACED 이펙트를 추가합니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            nestedRoutes: [
              {
                pushedBy: {
                  name: "NestedReplaced",
                },
              } as any,
            ],
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "NESTED_REPLACED",
      activity: {
        id: "1",
        name: "hello",
        transitionState: "enter-done",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        nestedRoutes: [
          {
            pushedBy: {
              name: "NestedReplaced",
            },
          } as any,
        ],
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      activityNestedRoute: {
        pushedBy: {
          name: "NestedReplaced",
        },
      } as any,
    },
  ]);
});

test("differences - Popped가 작동해 nestedPushedBy가 모두 삭제되면, POPPED 이벤트와 함께 NESTED_POPPED 이펙트가 함께 여러번 일어납니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            nestedRoutes: [
              {
                pushedBy: {
                  name: "NestedPushed",
                },
              } as any,
              {
                pushedBy: {
                  name: "NestedPushed",
                },
              } as any,
            ],
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: false,
            zIndex: 0,
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: true,
            zIndex: 0,
          },
        ],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "NESTED_POPPED",
      activity: {
        id: "2",
        name: "hello",
        transitionState: "exit-active",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        zIndex: 0,
      },
    },
    {
      _TAG: "NESTED_POPPED",
      activity: {
        id: "2",
        name: "hello",
        transitionState: "exit-active",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        zIndex: 0,
      },
    },
    {
      _TAG: "POPPED",
      activity: {
        id: "2",
        name: "hello",
        transitionState: "exit-active",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        zIndex: 0,
      },
    },
  ]);
});

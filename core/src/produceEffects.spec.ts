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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        registeredActivities: [{ name: "hello" }],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {
              hello: "world",
            },
            pushedBy: {
              name: "Pushed",
            } as any,
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
        registeredActivities: [{ name: "hello" }],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
        steps: [
          {
            id: "1",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
        ],
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
        registeredActivities: [{ name: "hello" }],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
        steps: [
          {
            id: "1",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
        ],
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
        steps: [
          {
            id: "2",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
        ],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
        steps: [
          {
            id: "2",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
        ],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
        steps: [
          {
            id: "2",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
        ],
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
        steps: [
          {
            id: "1",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
        ],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: -1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
        steps: [
          {
            id: "2",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
        ],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            zIndex: -1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "3",
                params: {},
                pushedBy: {
                  name: "Replaced",
                } as any,
              },
            ],
            pushedBy: {
              name: "Replaced",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
        steps: [
          {
            id: "3",
            params: {},
            pushedBy: {
              name: "Replaced",
            } as any,
          },
        ],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
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
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Replaced",
                } as any,
              },
            ],
            pushedBy: {
              name: "Replaced",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
        steps: [
          {
            id: "2",
            params: {},
            pushedBy: {
              name: "Replaced",
            } as any,
          },
        ],
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

test("differences - StepPushed가 작동해 steps가 늘어난 경우, STEP_PUSHED 이펙트를 추가합니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        registeredActivities: [{ name: "hello" }],
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
            steps: [
              {
                id: "1",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
              {
                id: "s1",
                params: {},
                pushedBy: {
                  name: "StepPushed",
                } as any,
              },
              {
                id: "s2",
                params: {},
                pushedBy: {
                  name: "StepPushed",
                } as any,
              },
            ],
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        registeredActivities: [{ name: "hello" }],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "STEP_PUSHED",
      activity: {
        id: "1",
        name: "hello",
        transitionState: "enter-done",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        steps: [
          {
            id: "1",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
          {
            id: "s1",
            params: {},
            pushedBy: {
              name: "StepPushed",
            } as any,
          },
          {
            id: "s2",
            params: {},
            pushedBy: {
              name: "StepPushed",
            } as any,
          },
        ],
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      step: {
        id: "s1",
        params: {},
        pushedBy: {
          name: "StepPushed",
        } as any,
      } as any,
    },
    {
      _TAG: "STEP_PUSHED",
      activity: {
        id: "1",
        name: "hello",
        transitionState: "enter-done",
        params: {},
        pushedBy: {
          name: "Pushed",
        } as any,
        steps: [
          {
            id: "1",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
          {
            id: "s1",
            params: {},
            pushedBy: {
              name: "StepPushed",
            } as any,
          },
          {
            id: "s2",
            params: {},
            pushedBy: {
              name: "StepPushed",
            } as any,
          },
        ],
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      step: {
        id: "s2",
        params: {},
        pushedBy: {
          name: "StepPushed",
        } as any,
      },
    },
  ]);
});

test("differences - StepReplaced가 작동해 파라미터가 바뀐 경우, STEP_REPLACED 이펙트를 추가합니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {
              hello: "world",
            },
            steps: [
              {
                id: "1",
                params: {
                  hello: "world",
                },
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        registeredActivities: [{ name: "hello" }],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {
              hello: "world2",
            },
            steps: [
              {
                id: "s1",
                params: {
                  hello: "world2",
                },
                pushedBy: {
                  name: "StepReplaced",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        registeredActivities: [{ name: "hello" }],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "STEP_REPLACED",
      activity: {
        id: "1",
        name: "hello",
        transitionState: "enter-done",
        params: {
          hello: "world2",
        },
        steps: [
          {
            id: "s1",
            params: {
              hello: "world2",
            },
            pushedBy: {
              name: "StepReplaced",
            } as any,
          },
        ],
        pushedBy: {
          name: "Pushed",
        },
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      step: {
        id: "s1",
        params: {
          hello: "world2",
        },
        pushedBy: {
          name: "StepReplaced",
        } as any,
      },
    },
  ]);
});

test("differences - Popped가 작동해 steps가 모두 삭제되면, POPPED 이벤트와 함께 STEP_POPPED 이펙트가 함께 여러번 일어납니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "2",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
              {
                id: "s1",
                params: {},
                pushedBy: {
                  name: "StepPushed",
                } as any,
              },
              {
                id: "s2",
                params: {},
                pushedBy: {
                  name: "StepPushed",
                } as any,
              },
            ],
            isActive: true,
            isTop: true,
            zIndex: 0,
          },
        ],
        registeredActivities: [{ name: "hello" }],
        transitionDuration: 300,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "2",
            name: "hello",
            transitionState: "exit-active",
            params: {},
            steps: [
              {
                id: "2",
                params: {},
                pushedBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            pushedBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: true,
            zIndex: 0,
          },
        ],
        registeredActivities: [{ name: "hello" }],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "STEP_POPPED",
      activity: {
        id: "2",
        name: "hello",
        transitionState: "exit-active",
        params: {},
        steps: [
          {
            id: "2",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
        ],
        pushedBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        zIndex: 0,
      },
    },
    {
      _TAG: "STEP_POPPED",
      activity: {
        id: "2",
        name: "hello",
        transitionState: "exit-active",
        params: {},
        steps: [
          {
            id: "2",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
        ],
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
        steps: [
          {
            id: "2",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
        ],
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

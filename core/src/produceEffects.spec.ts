import { produceEffects } from "./produceEffects";

test("productEffects - 알 수 없는 이유로 두 object가 다르다면, %SOMETHING_CHANGED%를 결과로 포함합니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            enteredBy: {
              name: "Pushed",
            } as any,
            steps: [
              {
                id: "1",
                params: {},
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            isActive: true,
            isTop: true,
            isRoot: true,
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
            enteredBy: {
              name: "Pushed",
            } as any,
            steps: [
              {
                id: "1",
                params: {},
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            isActive: true,
            isTop: true,
            isRoot: false,
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

test("productEffects - 새로운 액티비티가 추가되었다면, PUSHED 이펙트를 결과로 포함합니다", () => {
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: true,
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
            enteredBy: {
              name: "Pushed",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        } as any,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      },
    },
  ]);
});

test("productEffects - 여러개 액티비티가 추가되었다면, PUSHED 이펙트가 순서대로 추가됩니다", () => {
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: true,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: false,
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
            enteredBy: {
              name: "Pushed",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: false,
        isRoot: true,
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
            enteredBy: {
              name: "Pushed",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        } as any,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      },
    },
  ]);
});

test("productEffects - 액티비티 상태가 exit-active로 변한 액티비티가 있다면, POPPED 이펙트가 추가됩니다", () => {
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: true,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: false,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: false,
            isRoot: true,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: true,
            isRoot: false,
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
            enteredBy: {
              name: "Pushed",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      },
    },
  ]);
});

test("productEffects - 액티비티 상태가 exit-active로 변한 액티비티가 여러개 있다면, POPPED 이펙트가 액티비티가 쌓인 zOrder와 반대로 추가됩니다", () => {
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: true,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: false,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: false,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: true,
            isRoot: false,
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
            enteredBy: {
              name: "Pushed",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        isRoot: false,
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
            enteredBy: {
              name: "Pushed",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: 0,
      },
    },
  ]);
});

test("productEffects - PushedEvent로 인해 액티비티 상태가 enter-active로 변한 액티비티가 있다면, PUSHED 이펙트가 추가됩니다", () => {
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: true,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: false,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: true,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: false,
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
            enteredBy: {
              name: "Pushed",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        } as any,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      },
    },
  ]);
});

test("productEffects - Replaced 이벤트로 인해 액티비티 상태가 enter-active로 변한 액티비티가 있다면, REPLACED 이펙트가 추가됩니다", () => {
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: true,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: false,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: true,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: false,
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
                enteredBy: {
                  name: "Replaced",
                } as any,
              },
            ],
            enteredBy: {
              name: "Replaced",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: true,
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
            enteredBy: {
              name: "Replaced",
            } as any,
          },
        ],
        enteredBy: {
          name: "Replaced",
        } as any,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 1,
      },
    },
  ]);
});

test("productEffects - Replaced 이벤트로 인해 아래 액티비티 상태가 exit-done으로 변한 액티비티가 있다면, 아무 이펙트도 호출하지 않습니다", () => {
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: true,
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
                enteredBy: {
                  name: "Replaced",
                } as any,
              },
            ],
            enteredBy: {
              name: "Replaced",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "exit-done",
            params: {},
            steps: [
              {
                id: "1",
                params: {},
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: false,
            zIndex: -1,
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
                enteredBy: {
                  name: "Replaced",
                } as any,
              },
            ],
            enteredBy: {
              name: "Replaced",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: true,
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
  ]);
});

test("productEffects - 아래 액티비티가 Replaced를 통해 Push된 상태에서 Replaced 이벤트로 인해 아래 액티비티 상태가 exit-done으로 변한 경우, 아무 이펙트도 호출하지 않습니다", () => {
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
                enteredBy: {
                  name: "Replaced",
                } as any,
              },
            ],
            enteredBy: {
              name: "Replaced",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: true,
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
                enteredBy: {
                  name: "Replaced",
                } as any,
              },
            ],
            enteredBy: {
              name: "Replaced",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: true,
            zIndex: 1,
          },
        ],
        registeredActivities: [{ name: "hello" }],
        transitionDuration: 300,
        globalTransitionState: "loading",
      },
      {
        activities: [
          {
            id: "1",
            name: "hello",
            transitionState: "exit-done",
            params: {},
            steps: [
              {
                id: "1",
                params: {},
                enteredBy: {
                  name: "Replaced",
                } as any,
              },
            ],
            enteredBy: {
              name: "Replaced",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: false,
            zIndex: -1,
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
                enteredBy: {
                  name: "Replaced",
                } as any,
              },
            ],
            enteredBy: {
              name: "Replaced",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: true,
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
  ]);
});

test("productEffects - Replaced 이벤트에 같은 activityId를 넘겨주어 액티비티 상태가 변한 액티비티가 있다면, REPLACED 이펙트가 추가됩니다", () => {
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: true,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: false,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: false,
            isRoot: true,
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
                enteredBy: {
                  name: "Replaced",
                } as any,
              },
            ],
            enteredBy: {
              name: "Replaced",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: false,
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
            enteredBy: {
              name: "Replaced",
            } as any,
          },
        ],
        enteredBy: {
          name: "Replaced",
        } as any,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      },
    },
  ]);
});

test("productEffects - StepPushed가 작동해 steps가 늘어난 경우, STEP_PUSHED 이펙트를 추가합니다", () => {
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: true,
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
            enteredBy: {
              name: "Pushed",
            } as any,
            steps: [
              {
                id: "1",
                params: {},
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
              {
                id: "s1",
                params: {},
                enteredBy: {
                  name: "StepPushed",
                } as any,
              },
              {
                id: "s2",
                params: {},
                enteredBy: {
                  name: "StepPushed",
                } as any,
              },
            ],
            isActive: true,
            isTop: true,
            isRoot: true,
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
        enteredBy: {
          name: "Pushed",
        } as any,
        steps: [
          {
            id: "1",
            params: {},
            enteredBy: {
              name: "Pushed",
            } as any,
          },
          {
            id: "s1",
            params: {},
            enteredBy: {
              name: "StepPushed",
            } as any,
          },
          {
            id: "s2",
            params: {},
            enteredBy: {
              name: "StepPushed",
            } as any,
          },
        ],
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      },
      step: {
        id: "s1",
        params: {},
        enteredBy: {
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
        enteredBy: {
          name: "Pushed",
        } as any,
        steps: [
          {
            id: "1",
            params: {},
            enteredBy: {
              name: "Pushed",
            } as any,
          },
          {
            id: "s1",
            params: {},
            enteredBy: {
              name: "StepPushed",
            } as any,
          },
          {
            id: "s2",
            params: {},
            enteredBy: {
              name: "StepPushed",
            } as any,
          },
        ],
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      },
      step: {
        id: "s2",
        params: {},
        enteredBy: {
          name: "StepPushed",
        } as any,
      },
    },
  ]);
});

test("produceEffects - StepPushed after Replaced events produces only STEP_PUSHED effect", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "5f677b4ce2840",
            name: "common.root",
            transitionState: "exit-done",
            params: {},
            steps: [
              {
                id: "5f677b4ce2840",
                params: {},
                enteredBy: {
                  id: "5f677b4ce2841",
                  eventDate: 1678368818504,
                  activityId: "5f677b4ce2840",
                  activityName: "common.root",
                  activityParams: {},
                  activityContext: {
                    path: "/",
                  },
                  name: "Pushed",
                },
              },
            ],
            enteredBy: {
              id: "5f677b4ce2841",
              eventDate: 1678368818504,
              activityId: "5f677b4ce2840",
              activityName: "common.root",
              activityParams: {},
              activityContext: {
                path: "/",
              },
              name: "Pushed",
            },
            exitedBy: {
              id: "5f677b4cea15a",
              eventDate: 1678368878535.003,
              activityId: "5f677b4cea159",
              activityName: "common.main",
              activityParams: {
                entry: "common.root",
              },
              skipEnterActiveState: false,
              activityContext: {
                path: "/main/?entry=common.root",
              },
              name: "Replaced",
            },
            isTop: false,
            isActive: false,
            isRoot: false,
            zIndex: -1,
            context: {
              path: "/",
            },
          },
          {
            id: "5f677b4cea159",
            name: "common.main",
            transitionState: "enter-done",
            params: {
              entry: "common.root",
            },
            steps: [
              {
                id: "5f677b4cea159",
                params: {
                  entry: "common.root",
                },
                enteredBy: {
                  id: "5f677b4cea15a",
                  eventDate: 1678368878535.003,
                  activityId: "5f677b4cea159",
                  activityName: "common.main",
                  activityParams: {
                    entry: "common.root",
                  },
                  skipEnterActiveState: false,
                  activityContext: {
                    path: "/main/?entry=common.root",
                  },
                  name: "Replaced",
                },
              },
            ],
            enteredBy: {
              id: "5f677b4cea15a",
              eventDate: 1678368878535.003,
              activityId: "5f677b4cea159",
              activityName: "common.main",
              activityParams: {
                entry: "common.root",
              },
              skipEnterActiveState: false,
              activityContext: {
                path: "/main/?entry=common.root",
              },
              name: "Replaced",
            },
            isTop: true,
            isActive: true,
            isRoot: true,
            zIndex: 0,
            context: {
              path: "/main/?entry=common.root",
            },
          },
        ],
        registeredActivities: [],
        transitionDuration: 350,
        globalTransitionState: "idle",
      },
      {
        activities: [
          {
            id: "5f677b4ce2840",
            name: "common.root",
            transitionState: "exit-done",
            params: {},
            steps: [
              {
                id: "5f677b4ce2840",
                params: {},
                enteredBy: {
                  id: "5f677b4ce2841",
                  eventDate: 1678368818504,
                  activityId: "5f677b4ce2840",
                  activityName: "common.root",
                  activityParams: {},
                  activityContext: {
                    path: "/",
                  },
                  name: "Pushed",
                },
              },
            ],
            enteredBy: {
              id: "5f677b4ce2841",
              eventDate: 1678368818504,
              activityId: "5f677b4ce2840",
              activityName: "common.root",
              activityParams: {},
              activityContext: {
                path: "/",
              },
              name: "Pushed",
            },
            exitedBy: {
              id: "5f677b4cea15a",
              eventDate: 1678368878535.003,
              activityId: "5f677b4cea159",
              activityName: "common.main",
              activityParams: {
                entry: "common.root",
              },
              skipEnterActiveState: false,
              activityContext: {
                path: "/main/?entry=common.root",
              },
              name: "Replaced",
            },
            isTop: false,
            isActive: false,
            isRoot: false,
            zIndex: -1,
            context: {
              path: "/",
            },
          },
          {
            id: "5f677b4cea159",
            name: "common.main",
            transitionState: "enter-done",
            params: {
              pageCode: "common.main_nested_search",
            },
            steps: [
              {
                id: "5f677b4cea159",
                params: {
                  entry: "common.root",
                },
                enteredBy: {
                  id: "5f677b4cea15a",
                  eventDate: 1678368878535.003,
                  activityId: "5f677b4cea159",
                  activityName: "common.main",
                  activityParams: {
                    entry: "common.root",
                  },
                  skipEnterActiveState: false,
                  activityContext: {
                    path: "/main/?entry=common.root",
                  },
                  name: "Replaced",
                },
              },
              {
                id: "5f67812e31e40",
                params: {
                  pageCode: "common.main_nested_search",
                },
                enteredBy: {
                  id: "5f67812e31e41",
                  eventDate: 1678370456936.002,
                  stepId: "5f67812e31e40",
                  stepParams: {
                    pageCode: "common.main_nested_search",
                  },
                  name: "StepPushed",
                },
              },
            ],
            enteredBy: {
              id: "5f677b4cea15a",
              eventDate: 1678368878535.003,
              activityId: "5f677b4cea159",
              activityName: "common.main",
              activityParams: {
                entry: "common.root",
              },
              skipEnterActiveState: false,
              activityContext: {
                path: "/main/?entry=common.root",
              },
              name: "Replaced",
            },
            isTop: true,
            isActive: true,
            isRoot: true,
            zIndex: 0,
            context: {
              path: "/main/?entry=common.root",
            },
          },
        ],
        registeredActivities: [],
        transitionDuration: 350,
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
        id: "5f677b4cea159",
        name: "common.main",
        transitionState: "enter-done",
        params: {
          pageCode: "common.main_nested_search",
        },
        steps: [
          {
            id: "5f677b4cea159",
            params: {
              entry: "common.root",
            },
            enteredBy: {
              id: "5f677b4cea15a",
              eventDate: 1678368878535.003,
              activityId: "5f677b4cea159",
              activityName: "common.main",
              activityParams: {
                entry: "common.root",
              },
              skipEnterActiveState: false,
              activityContext: {
                path: "/main/?entry=common.root",
              },
              name: "Replaced",
            },
          },
          {
            id: "5f67812e31e40",
            params: {
              pageCode: "common.main_nested_search",
            },
            enteredBy: {
              id: "5f67812e31e41",
              eventDate: 1678370456936.002,
              stepId: "5f67812e31e40",
              stepParams: {
                pageCode: "common.main_nested_search",
              },
              name: "StepPushed",
            },
          },
        ],
        enteredBy: {
          id: "5f677b4cea15a",
          eventDate: 1678368878535.003,
          activityId: "5f677b4cea159",
          activityName: "common.main",
          activityParams: {
            entry: "common.root",
          },
          skipEnterActiveState: false,
          activityContext: {
            path: "/main/?entry=common.root",
          },
          name: "Replaced",
        },
        isTop: true,
        isActive: true,
        isRoot: true,
        zIndex: 0,
        context: {
          path: "/main/?entry=common.root",
        },
      },
      step: {
        id: "5f67812e31e40",
        params: {
          pageCode: "common.main_nested_search",
        },
        enteredBy: {
          id: "5f67812e31e41",
          eventDate: 1678370456936.002,
          stepId: "5f67812e31e40",
          stepParams: {
            pageCode: "common.main_nested_search",
          },
          name: "StepPushed",
        },
      },
    },
  ]);
});

test("productEffects - StepReplaced가 작동해 파라미터가 바뀐 경우, STEP_REPLACED 이펙트를 추가합니다", () => {
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: true,
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
                enteredBy: {
                  name: "StepReplaced",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: true,
            isTop: true,
            isRoot: false,
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
            enteredBy: {
              name: "StepReplaced",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        },
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 0,
      },
      step: {
        id: "s1",
        params: {
          hello: "world2",
        },
        enteredBy: {
          name: "StepReplaced",
        } as any,
      },
    },
  ]);
});

test("productEffects - Popped가 작동해 steps가 모두 삭제되면, POPPED 이벤트와 함께 STEP_POPPED 이펙트가 함께 여러번 일어납니다", () => {
  expect(
    produceEffects(
      {
        activities: [
          {
            id: "2",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            enteredBy: {
              name: "Pushed",
            } as any,
            steps: [
              {
                id: "2",
                params: {},
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
              {
                id: "s1",
                params: {},
                enteredBy: {
                  name: "StepPushed",
                } as any,
              },
              {
                id: "s2",
                params: {},
                enteredBy: {
                  name: "StepPushed",
                } as any,
              },
            ],
            isActive: true,
            isTop: true,
            isRoot: true,
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
                enteredBy: {
                  name: "Pushed",
                } as any,
              },
            ],
            enteredBy: {
              name: "Pushed",
            } as any,
            isActive: false,
            isTop: true,
            isRoot: false,
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
            enteredBy: {
              name: "Pushed",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        isRoot: false,
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
            enteredBy: {
              name: "Pushed",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        isRoot: false,
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
            enteredBy: {
              name: "Pushed",
            } as any,
          },
        ],
        enteredBy: {
          name: "Pushed",
        } as any,
        isActive: false,
        isTop: true,
        isRoot: false,
        zIndex: 0,
      },
    },
  ]);
});

test("produceEffects - Paused가 작동해, globalTransitionState가 paused로 변하면 PAUSED 이펙트가 일어납니다", () => {
  expect(
    produceEffects(
      {
        activities: [],
        globalTransitionState: "idle",
        registeredActivities: [],
        transitionDuration: 270,
      },
      {
        activities: [],
        globalTransitionState: "paused",
        registeredActivities: [],
        transitionDuration: 270,
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "PAUSED",
    },
  ]);

  expect(
    produceEffects(
      {
        activities: [],
        globalTransitionState: "loading",
        registeredActivities: [],
        transitionDuration: 270,
      },
      {
        activities: [],
        globalTransitionState: "paused",
        registeredActivities: [],
        transitionDuration: 270,
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "PAUSED",
    },
  ]);
});

test("produceEffects - Resumed가 작동해, globalTransitionState가 paused에서 idle|loading으로 변하면 RESUMED 이펙트가 일어납니다", () => {
  expect(
    produceEffects(
      {
        activities: [],
        globalTransitionState: "paused",
        registeredActivities: [],
        transitionDuration: 270,
      },
      {
        activities: [],
        globalTransitionState: "idle",
        registeredActivities: [],
        transitionDuration: 270,
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "RESUMED",
    },
  ]);

  expect(
    produceEffects(
      {
        activities: [],
        globalTransitionState: "paused",
        registeredActivities: [],
        transitionDuration: 270,
      },
      {
        activities: [],
        globalTransitionState: "loading",
        registeredActivities: [],
        transitionDuration: 270,
      },
    ),
  ).toEqual([
    {
      _TAG: "%SOMETHING_CHANGED%",
    },
    {
      _TAG: "RESUMED",
    },
  ]);
});

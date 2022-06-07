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
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
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
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
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
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
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
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
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
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
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
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
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
          },
          {
            id: "2",
            name: "hello",
            transitionState: "enter-active",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
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
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
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
          },
          {
            id: "2",
            name: "hello",
            transitionState: "exit-done",
            params: {},
            pushedBy: {
              name: "Pushed",
            } as any,
          },
          {
            id: "3",
            name: "hello",
            transitionState: "enter-active",
            params: {},
            pushedBy: {
              name: "Replaced",
            } as any,
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
      },
    },
  ]);
});

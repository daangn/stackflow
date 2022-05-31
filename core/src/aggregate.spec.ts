import { aggregate } from "./aggregate";
import { makeEvent } from "./event-utils";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;

const nowTime = () => new Date().getTime();
const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

const initializedEvent = ({
  transitionDuration,
}: {
  transitionDuration: number;
}) =>
  makeEvent("Initialized", {
    transitionDuration,
    eventDate: enoughPastTime(),
  });

const registeredEvent = ({ activityName }: { activityName: string }) =>
  makeEvent("ActivityRegistered", {
    activityName,
    eventDate: enoughPastTime(),
  });

test("aggregate - 만약에 InitializedEvent만 존재하는 경우, 빈 스택을 내려줍니다", () => {
  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
    ],
    nowTime(),
  );

  expect(output).toStrictEqual({
    activities: [],
    globalTransitionState: "idle",
  });
});

test("aggregate - 푸시하면 스택에 추가됩니다", () => {
  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "home",
      }),
      registeredEvent({
        activityName: "sample",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "sample",
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
      },
    ],
    globalTransitionState: "idle",
  });
});

test("aggregate - PushedEvent에 activityId, activityName이 다른 경우 스택에 반영됩니다", () => {
  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "home",
      }),
      registeredEvent({
        activityName: "sample2",
      }),
      makeEvent("Pushed", {
        activityId: "a2",
        activityName: "sample2",
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a2",
        name: "sample2",
        transitionState: "enter-done",
      },
    ],
    globalTransitionState: "idle",
  });
});

test("aggregate - 같은 activityId로 여러번 푸시되는 경우 throw 합니다", () => {
  expect(() => {
    aggregate(
      [
        initializedEvent({
          transitionDuration: 300,
        }),
        registeredEvent({
          activityName: "home",
        }),
        registeredEvent({
          activityName: "sample2",
        }),
        makeEvent("Pushed", {
          activityId: "a1",
          activityName: "sample2",
          eventDate: enoughPastTime(),
        }),
        makeEvent("Pushed", {
          activityId: "a1",
          activityName: "sample2",
          eventDate: enoughPastTime(),
        }),
      ],
      nowTime(),
    );
  }).toThrow();
});

test("aggregate - 다른 activityName으로 두번 푸시하면 스택에 정상적으로 반영됩니다", () => {
  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "home",
      }),
      registeredEvent({
        activityName: "sample2",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "sample2",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a2",
        activityName: "home",
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample2",
        transitionState: "enter-done",
      },
      {
        id: "a2",
        name: "home",
        transitionState: "enter-done",
      },
    ],
    globalTransitionState: "idle",
  });
});

test("aggregate - 같은 activityName으로 두번 푸시하면 정상적으로 스택에 반영됩니다", () => {
  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "home",
      }),
      registeredEvent({
        activityName: "sample2",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "sample2",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a2",
        activityName: "sample2",
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample2",
        transitionState: "enter-done",
      },
      {
        id: "a2",
        name: "sample2",
        transitionState: "enter-done",
      },
    ],
    globalTransitionState: "idle",
  });
});

test("aggregate - 푸시한 직후에는 transition.state가 loading 입니다", () => {
  const t = nowTime();

  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "sample",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "sample",
        eventDate: t,
      }),
    ],
    t,
  );

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
      },
    ],
    globalTransitionState: "loading",
  });
});

test("aggregate - 현재 시간과 변화된 시간의 차가 InitializedEvent의 transitionDuration 보다 작다면 transition.state가 loading 입니다", () => {
  const t = nowTime();

  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "sample",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "sample",
        eventDate: t - 150,
      }),
    ],
    t,
  );

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
      },
    ],
    globalTransitionState: "loading",
  });
});

test("aggregate - 푸시한 이후 InitializedEvent에서 셋팅된 transitionDuration만큼 정확하게 지난 경우 transition.state가 idle 입니다", () => {
  const t = nowTime();

  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "sample",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "sample",
        eventDate: t - 300,
      }),
    ],
    t,
  );

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
      },
    ],
    globalTransitionState: "idle",
  });
});

test("aggregate - 여러번 푸시한 경우, transitionDuration 전에 푸시한 Activity의 transition.state는 enter-done, 그 이후 푸시한 Activity는 enter-active 입니다", () => {
  const t = nowTime();

  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "sample",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "sample",
        eventDate: t - 350,
      }),
      makeEvent("Pushed", {
        activityId: "a2",
        activityName: "sample",
        eventDate: t - 150,
      }),
    ],
    t,
  );

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
      },
      {
        id: "a2",
        name: "sample",
        transitionState: "enter-active",
      },
    ],
    globalTransitionState: "loading",
  });
});

test("aggregate - Pop하면 최상단에 존재하는 Activity가 exit-done 상태가 됩니다", () => {
  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "home",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "home",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a2",
        activityName: "home",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Popped", {
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-done",
      },
    ],
    globalTransitionState: "idle",
  });
});

test("aggregate - Pop을 여러번하면 차례대로 exit-done 상태가 됩니다", () => {
  const initEvents = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a3",
      activityName: "home",
      eventDate: enoughPastTime(),
    }),
  ];

  const o1 = aggregate(
    [
      ...initEvents,
      makeEvent("Popped", {
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(o1).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
      },
      {
        id: "a2",
        name: "home",
        transitionState: "enter-done",
      },
      {
        id: "a3",
        name: "home",
        transitionState: "exit-done",
      },
    ],
    globalTransitionState: "idle",
  });

  const o2 = aggregate(
    [
      ...initEvents,
      makeEvent("Popped", {
        eventDate: enoughPastTime(),
      }),
      makeEvent("Popped", {
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(o2).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-done",
      },
      {
        id: "a3",
        name: "home",
        transitionState: "exit-done",
      },
    ],
    globalTransitionState: "idle",
  });
});

test("aggregate - 가장 바닥에 있는 Activity는 Pop 되지 않습니다", () => {
  const initEvents = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      eventDate: enoughPastTime(),
    }),
  ];

  const output1 = aggregate(
    [
      ...initEvents,
      makeEvent("Popped", {
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(output1).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-done",
      },
    ],
    globalTransitionState: "idle",
  });

  const output2 = aggregate(
    [
      ...initEvents,
      makeEvent("Popped", {
        eventDate: enoughPastTime(),
      }),
      makeEvent("Popped", {
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(output2).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-done",
      },
    ],
    globalTransitionState: "idle",
  });
});

test("aggregate - transitionDuration 이전에 Pop을 한 경우 exit-active 상태입니다", () => {
  const t = nowTime();

  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
      registeredEvent({
        activityName: "home",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "home",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a2",
        activityName: "home",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Popped", {
        eventDate: t - 150,
      }),
    ],
    t,
  );

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-active",
      },
    ],
    globalTransitionState: "loading",
  });
});

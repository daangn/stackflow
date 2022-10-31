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

test("aggregate - InitializedEvent만 존재하는 경우, 빈 스택을 내려줍니다", () => {
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
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 푸시하면 스택에 추가됩니다", () => {
  const events = [
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
      activityParams: {},
    }),
  ];
  const pushedEvent = events[3];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - PushedEvent에 activityId, activityName이 다른 경우 스택에 반영됩니다", () => {
  const events = [
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
      activityParams: {},
    }),
  ];

  const pushedEvent = events[3];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a2",
        name: "sample2",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 같은 activityId로 여러번 푸시되는 경우 이전의 만들어진 Pushed는 무시됩니다", () => {
  const events = [
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
      activityParams: {},
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample2",
      eventDate: enoughPastTime(),
      activityParams: {},
    }),
  ];

  const pushedEvent2 = events[4];

  const output = aggregate(events, nowTime());

  expect(output).toEqual({
    activities: [
      {
        id: "a1",
        name: "sample2",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent2,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 다른 activityName으로 두번 푸시하면 스택에 정상적으로 반영됩니다", () => {
  const events = [
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
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
  ];

  const pushedEvent1 = events[3];
  const pushedEvent2 = events[4];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample2",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent1,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "home",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent2,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 같은 activityName으로 두번 푸시하면 정상적으로 스택에 반영됩니다", () => {
  const events = [
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
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample2",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
  ];

  const pushedEvent1 = events[3];
  const pushedEvent2 = events[4];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample2",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent1,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "sample2",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent2,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 푸시한 직후에는 transition.state가 enter-active 입니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      eventDate: t,
    }),
  ];

  const pushedEvent = events[2];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        pushedBy: pushedEvent,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - 현재 시간과 변화된 시간의 차가 InitializedEvent의 transitionDuration 보다 작다면 transition.state가 enter-active 입니다", () => {
  const t = nowTime();
  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      eventDate: t - 150,
    }),
  ];

  const pushedEvent = events[2];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        pushedBy: pushedEvent,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - 푸시한 이후 InitializedEvent에서 셋팅된 transitionDuration만큼 정확하게 지난 경우 transition.state가 enter-done 입니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      eventDate: t - 300,
    }),
  ];

  const pushedEvent = events[2];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 여러번 푸시한 경우, transitionDuration 전에 푸시한 Activity의 transition.state는 enter-done, 그 이후 푸시한 Activity는 enter-active 입니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      eventDate: t - 350,
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {},
      eventDate: t - 150,
    }),
  ];

  const pushedEvent1 = events[2];
  const pushedEvent2 = events[3];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent1,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        pushedBy: pushedEvent2,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - Pop하면 최상단에 존재하는 Activity가 exit-done 상태가 됩니다", () => {
  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Popped", {
      eventDate: enoughPastTime(),
    }),
  ];

  const pushedEvent1 = events[2];
  const pushedEvent2 = events[3];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent1,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        pushedBy: pushedEvent2,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
    ],
    transitionDuration: 300,
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
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a3",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
  ];

  const pushedEvent1 = initEvents[2];
  const pushedEvent2 = initEvents[3];
  const pushedEvent3 = initEvents[4];

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
        params: {},
        pushedBy: pushedEvent1,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "home",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent2,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
      {
        id: "a3",
        name: "home",
        transitionState: "exit-done",
        params: {},
        pushedBy: pushedEvent3,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
    ],
    transitionDuration: 300,
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
        params: {},
        pushedBy: pushedEvent1,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        pushedBy: pushedEvent2,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
      {
        id: "a3",
        name: "home",
        transitionState: "exit-done",
        params: {},
        pushedBy: pushedEvent3,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
    ],
    transitionDuration: 300,
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
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
  ];

  const pushedEvent1 = initEvents[2];
  const pushedEvent2 = initEvents[3];

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
        params: {},
        pushedBy: pushedEvent1,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        pushedBy: pushedEvent2,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
    ],
    transitionDuration: 300,
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
        params: {},
        pushedBy: pushedEvent1,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        pushedBy: pushedEvent2,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - transitionDuration 이전에 Pop을 한 경우 exit-active 상태입니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Popped", {
      eventDate: t - 150,
    }),
  ];

  const pushedEvent1 = events[2];
  const pushedEvent2 = events[3];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent1,
        isActive: true,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-active",
        params: {},
        pushedBy: pushedEvent2,
        isActive: false,
        isTop: true,
        zIndex: 1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - 이벤트가 중복되거나 순서가 섞여도 정상적으로 작동합니다", () => {
  const e1 = initializedEvent({
    transitionDuration: 300,
  });
  const e2 = registeredEvent({
    activityName: "home",
  });
  const e3 = makeEvent("Pushed", {
    activityId: "a1",
    activityName: "home",
    activityParams: {},
    eventDate: enoughPastTime(),
  });
  const e4 = makeEvent("Pushed", {
    activityId: "a2",
    activityName: "home",
    activityParams: {},
    eventDate: enoughPastTime(),
  });
  const e5 = makeEvent("Popped", {
    eventDate: enoughPastTime(),
  });

  const output = aggregate([e5, e1, e4, e3, e5, e1, e1, e2], nowTime());

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        pushedBy: e3,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        pushedBy: e4,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 같은 activity.id로 푸시되는 경우, 기존에 푸시되어있던 액티비티를 재활용합니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a3",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a4",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Popped", {
      eventDate: enoughPastTime(),
    }),
    makeEvent("Popped", {
      eventDate: enoughPastTime(),
    }),
    makeEvent("Popped", {
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: t,
    }),
  ];

  const pushedEvent1 = events[2];
  const pushedEvent3 = events[4];
  const pushedEvent4 = events[5];
  const pushedEvent5 = events[9];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent1,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "home",
        transitionState: "enter-active",
        params: {},
        pushedBy: pushedEvent5,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
      {
        id: "a3",
        name: "home",
        transitionState: "exit-done",
        params: {},
        pushedBy: pushedEvent3,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
      {
        id: "a4",
        name: "home",
        transitionState: "exit-done",
        params: {},
        pushedBy: pushedEvent4,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - PushedEvent에 params가 담겨있는 경우 액티비티에 해당 params가 포함됩니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t,
    }),
  ];

  const pushedEvent = events[2];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - ReplacedEvent가 발생한 직후 최상단의 Activity를 유지하면서 새 Activity가 추가됩니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t,
    }),
  ];

  const pushedEvent = events[2];
  const replacedEvent = events[3];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "sample",
        transitionState: "enter-active",
        params: {
          hello: "world",
        },
        pushedBy: replacedEvent,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - ReplacedEvent가 발생한 후 transitionDuration만큼 지난 경우 기존 최상단 Activity의 상태를 exit-done으로 바꿉니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t,
    }),
  ];

  const pushedEvent = events[2];
  const replacedEvent = events[3];

  const output = aggregate(events, t + 300);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "exit-done",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
      {
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        pushedBy: replacedEvent,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - ReplacedEvent가 두 번 발생한 후 transitionDuration만큼 지난 경우 기존 최상단 Activity의 상태를 exit-done으로 바꿉니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Replaced", {
      activityId: "a3",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t,
    }),
  ];

  const pushedEvent = events[2];
  const replacedEvent1 = events[3];
  const replacedEvent2 = events[4];

  const output = aggregate(events, t + 300);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "exit-done",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
      {
        id: "a2",
        name: "sample",
        transitionState: "exit-done",
        params: {
          hello: "world",
        },
        pushedBy: replacedEvent1,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
      {
        id: "a3",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        pushedBy: replacedEvent2,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - skipEnterActiveState가 true이면 eventDate가 transitionDuration을 충족하지 않아도 enter-done 상태가 됩니다.", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t - 150,
      skipEnterActiveState: true,
    }),
  ];

  const pushedEvent = events[2];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - skipExitActiveState가 true이면 eventDate가 transitionDuration을 충족하지 않아도 exit-done 상태가 됩니다. ", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    makeEvent("Popped", {
      eventDate: t - 150,
      skipExitActiveState: true,
    }),
  ];

  const pushedEvent1 = events[2];
  const pushedEvent2 = events[3];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        pushedBy: pushedEvent1,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        pushedBy: pushedEvent2,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - skipExitActiveState가 true이면 ReplacedEvent가 발생한 직후 기존 최상단의 Activity는 바로 exit-done 상태가 되고 현재 최상단의 Activity는 바로 enter-done 상태가 됩니다.", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      eventDate: t,
      activityParams: {
        hello: "world",
      },
      skipEnterActiveState: true,
    }),
  ];

  const pushedEvent = events[2];
  const replacedEvent = events[3];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "exit-done",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent,
        isActive: false,
        isTop: false,
        zIndex: -1,
      },
      {
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        pushedBy: replacedEvent,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - PushedEvent에 activityContext가 담겨있는 경우 액티비티에 해당 activityContext가 포함됩니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      eventDate: t,
      activityContext: {
        hello: "world",
      },
    }),
  ];

  const pushedEvent = events[2];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        context: {
          hello: "world",
        },
        pushedBy: pushedEvent,
        isActive: true,
        isTop: true,
        zIndex: 0,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - ReplacedEvent에 activityContext가 담겨있는 경우 액티비티에 해당 activityContext가 포함됩니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      activityContext: {
        hello: "world1",
      },
      eventDate: t,
    }),
    makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {},
      activityContext: {
        hello: "world2",
      },
      eventDate: t,
    }),
  ];

  const pushedEvent = events[2];
  const replacedEvent = events[3];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        context: {
          hello: "world1",
        },
        pushedBy: pushedEvent,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        context: {
          hello: "world2",
        },
        pushedBy: replacedEvent,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - ReplacedEvent에 현재 상단에 존재하는 activityId가 포함된 경우, 해당하는 액티비티가 변경됩니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world2",
      },
      eventDate: t,
    }),
  ];

  const pushedEvent = events[2];
  const replacedEvent = events[4];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "sample",
        transitionState: "enter-active",
        params: {
          hello: "world2",
        },
        pushedBy: replacedEvent,
        isActive: true,
        isTop: true,
        zIndex: 1,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - ReplacedEvent에 현재 중간에 존재하는 activityId가 포함된 경우, 해당 액티비티가 변경됩니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a3",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world2",
      },
      eventDate: t,
    }),
  ];

  const pushedEvent1 = events[2];
  const pushedEvent3 = events[4];
  const replacedEvent = events[5];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent1,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "sample",
        transitionState: "enter-active",
        params: {
          hello: "world2",
        },
        pushedBy: replacedEvent,
        isActive: false,
        isTop: false,
        zIndex: 1,
      },
      {
        id: "a3",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent3,
        isActive: true,
        isTop: true,
        zIndex: 2,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - ReplacedEvent에 현재 중간에 존재하는 activityId가 포함되고 충분한 시간이 지난 경우, 해당 액티비티가 enter-done 상태를 유지합니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Pushed", {
      activityId: "a3",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world2",
      },
      eventDate: enoughPastTime(),
    }),
  ];

  const pushedEvent1 = events[2];
  const pushedEvent3 = events[4];
  const replacedEvent = events[5];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent1,
        isActive: false,
        isTop: false,
        zIndex: 0,
      },
      {
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world2",
        },
        pushedBy: replacedEvent,
        isActive: false,
        isTop: false,
        zIndex: 1,
      },
      {
        id: "a3",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        pushedBy: pushedEvent3,
        isActive: true,
        isTop: true,
        zIndex: 2,
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - ReplacedEvent가 같은 activityId로 여러번 수행되었을때도 정상 작동합니다", () => {
  const t = 1667218241499;

  const events = [
    {
      id: "97a1f31549f0",
      name: "Initialized" as const,
      eventDate: 1667218237525,
      transitionDuration: 350,
    },
    {
      id: "97a1f31549ee",
      name: "ActivityRegistered" as const,
      eventDate: 1667218237525,
      activityName: "Main",
    },
    {
      id: "97a1f31549ef",
      name: "ActivityRegistered" as const,
      eventDate: 1667218237525,
      activityName: "Article",
    },
    {
      id: "97a1f1f11a51",
      name: "Pushed" as const,
      eventDate: 1667217986388,
      activityId: "97a1f1f11a50",
      activityName: "Main",
      activityParams: {},
      activityContext: { path: "/" },
    },
    {
      id: "97a1f315c945",
      name: "Pushed" as const,
      eventDate: 1667218238201,
      activityId: "97a1f315c944",
      activityName: "Article",
      activityParams: { articleId: "02542470", title: "Master" },
      skipEnterActiveState: false,
      activityContext: { path: "/articles/02542470/?title=Master" },
    },
    {
      id: "97a1f315f4a0",
      name: "Replaced" as const,
      eventDate: 1667218238312,
      activityId: "97a1f315c944",
      activityName: "Article",
      activityParams: {
        articleId: "02542470",
        title: "Master",
        referrer: "my",
      },
      skipEnterActiveState: true,
      activityContext: { path: "/articles/02542470/?title=Master&referrer=my" },
    },
    {
      id: "97a1f317fc28",
      name: "Popped" as const,
      eventDate: 1667218239642,
    },
    {
      id: "97a1f3193f34",
      name: "Pushed" as const,
      eventDate: 1667218240469,
      activityId: "97a1f315c944",
      activityName: "Article",
      activityParams: {
        articleId: "02542470",
        title: "Master",
        referrer: "my",
      },
      activityContext: { path: "/articles/02542470/?title=Master&referrer=my" },
    },
    {
      id: "97a1f319689d",
      name: "Replaced" as const,
      eventDate: 1667218240575,
      activityId: "97a1f315c944",
      activityName: "Article",
      activityParams: {
        articleId: "02542470",
        title: "Master",
        referrer: "my",
      },
      skipEnterActiveState: true,
      activityContext: { path: "/articles/02542470/?title=Master&referrer=my" },
    },
    {
      id: "97a1f31ad18c",
      name: "Popped" as const,
      eventDate: 1667218241499,
    },
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "97a1f1f11a50",
        name: "Main",
        transitionState: "enter-done",
        params: {},
        pushedBy: {
          id: "97a1f1f11a51",
          name: "Pushed",
          eventDate: 1667217986388,
          activityId: "97a1f1f11a50",
          activityName: "Main",
          activityParams: {},
          activityContext: { path: "/" },
        },
        isTop: false,
        isActive: true,
        zIndex: 0,
        context: { path: "/" },
      },
      {
        id: "97a1f315c944",
        name: "Article",
        transitionState: "exit-active",
        params: { articleId: "02542470", title: "Master", referrer: "my" },
        pushedBy: {
          id: "97a1f319689d",
          name: "Replaced" as const,
          eventDate: 1667218240575,
          activityId: "97a1f315c944",
          activityName: "Article",
          activityParams: {
            articleId: "02542470",
            title: "Master",
            referrer: "my",
          },
          skipEnterActiveState: true,
          activityContext: {
            path: "/articles/02542470/?title=Master&referrer=my",
          },
        },
        isTop: true,
        isActive: false,
        zIndex: 1,
        context: { path: "/articles/02542470/?title=Master&referrer=my" },
      },
    ],
    transitionDuration: 350,
    globalTransitionState: "loading",
  });
});

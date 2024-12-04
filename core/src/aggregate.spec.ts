import type { Activity } from "./Stack";
import { aggregate } from "./aggregate";
import type {
  ActivityRegisteredEvent,
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "./event-types";
import type { BaseDomainEvent } from "./event-types/_base";
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

const registeredEvent = ({
  activityName,
  activityParamsSchema,
}: Omit<ActivityRegisteredEvent, keyof BaseDomainEvent>) =>
  makeEvent("ActivityRegistered", {
    activityName,
    activityParamsSchema,
    eventDate: enoughPastTime(),
  });

const activity = (activity: Activity) => activity;

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
    registeredActivities: [],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 푸시하면 스택에 추가됩니다", () => {
  let pushedEvent: PushedEvent;

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
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      eventDate: enoughPastTime(),
      activityParams: {},
    })),
  ];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - PushedEvent에 activityId, activityName이 다른 경우 스택에 반영됩니다", () => {
  let pushedEvent: PushedEvent;

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
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample2",
      eventDate: enoughPastTime(),
      activityParams: {},
    })),
  ];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a2",
        name: "sample2",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
      {
        name: "sample2",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 같은 activityId로 여러번 푸시되는 경우 이전의 만들어진 Pushed는 무시됩니다", () => {
  let pushedEvent2: PushedEvent;

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
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample2",
      eventDate: enoughPastTime(),
      activityParams: {},
    })),
  ];

  const output = aggregate(events, nowTime());

  expect(output).toEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample2",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
      {
        name: "sample2",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 다른 activityName으로 두번 푸시하면 스택에 정상적으로 반영됩니다", () => {
  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;

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
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample2",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
  ];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample2",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
      {
        name: "sample2",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 같은 activityName으로 두번 푸시하면 정상적으로 스택에 반영됩니다", () => {
  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;

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
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample2",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample2",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
  ];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample2",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "sample2",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
      {
        name: "sample2",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 푸시한 직후에는 transition.state가 enter-active 입니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - 현재 시간과 변화된 시간의 차가 InitializedEvent의 transitionDuration 보다 작다면 transition.state가 enter-active 입니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      eventDate: t - 150,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - 푸시한 이후 InitializedEvent에서 셋팅된 transitionDuration만큼 정확하게 지난 경우 transition.state가 enter-done 입니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      eventDate: t - 300,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 여러번 푸시한 경우, transitionDuration 전에 푸시한 Activity의 transition.state는 enter-done, 그 이후 푸시한 Activity는 enter-active 입니다", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      eventDate: t - 350,
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {},
      eventDate: t - 150,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - Pop하면 최상단에 존재하는 Activity가 exit-done 상태가 됩니다", () => {
  let pushedEvent1;
  let pushedEvent2;

  let poppedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (poppedEvent = makeEvent("Popped", {
      eventDate: enoughPastTime(),
    })),
  ];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        exitedBy: poppedEvent,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - Pop을 여러번하면 차례대로 exit-done 상태가 됩니다", () => {
  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;
  let pushedEvent3: PushedEvent;

  let poppedEvent1: PoppedEvent;
  let poppedEvent2: PoppedEvent;
  let poppedEvent3: PoppedEvent;

  const initEvents = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent3 = makeEvent("Pushed", {
      activityId: "a3",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
  ];

  const o1 = aggregate(
    [
      ...initEvents,
      (poppedEvent1 = makeEvent("Popped", {
        eventDate: enoughPastTime(),
      })),
    ],
    nowTime(),
  );

  expect(o1).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
      activity({
        id: "a3",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a3",
            params: {},
            enteredBy: pushedEvent3,
          },
        ],
        enteredBy: pushedEvent3,
        exitedBy: poppedEvent1,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });

  const o2 = aggregate(
    [
      ...initEvents,
      (poppedEvent2 = makeEvent("Popped", {
        eventDate: enoughPastTime(),
      })),
      (poppedEvent3 = makeEvent("Popped", {
        eventDate: enoughPastTime(),
      })),
    ],
    nowTime(),
  );

  expect(o2).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        exitedBy: poppedEvent3,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "a3",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a3",
            params: {},
            enteredBy: pushedEvent3,
          },
        ],
        enteredBy: pushedEvent3,
        exitedBy: poppedEvent2,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 가장 바닥에 있는 Activity는 Pop 되지 않습니다", () => {
  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;

  let poppedEvent1: PoppedEvent;
  let poppedEvent2: PoppedEvent;

  const initEvents = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
  ];

  const output1 = aggregate(
    [
      ...initEvents,
      (poppedEvent1 = makeEvent("Popped", {
        eventDate: enoughPastTime(),
      })),
    ],
    nowTime(),
  );

  expect(output1).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        exitedBy: poppedEvent1,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });

  const output2 = aggregate(
    [
      ...initEvents,
      (poppedEvent2 = makeEvent("Popped", {
        eventDate: enoughPastTime(),
      })),
      makeEvent("Popped", {
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(output2).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        exitedBy: poppedEvent2,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - push 후 replace 한 뒤 pop 을 수행하면 pop을 무효화한다.", () => {
  let pushedEvent1: PushedEvent;
  let replacedEvent1: ReplacedEvent;

  const initEvents = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
  ];

  const output1 = aggregate(
    [
      ...initEvents,
      (replacedEvent1 = makeEvent("Replaced", {
        activityId: "a2",
        activityName: "sample",
        activityParams: {},
        eventDate: enoughPastTime(),
      })),
      makeEvent("Popped", {
        eventDate: enoughPastTime(),
      }),
    ],
    nowTime(),
  );

  expect(output1).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        exitedBy: replacedEvent1,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: replacedEvent1,
          },
        ],
        enteredBy: replacedEvent1,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - transitionDuration 이전에 Pop을 한 경우 exit-active 상태입니다", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;

  let poppedEvent: PoppedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (poppedEvent = makeEvent("Popped", {
      eventDate: t - 150,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: true,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "home",
        transitionState: "exit-active",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        exitedBy: poppedEvent,
        isActive: false,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
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
      activity({
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: e3,
          },
        ],
        enteredBy: e3,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: e4,
          },
        ],
        enteredBy: e4,
        exitedBy: e5,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 같은 activity.id로 푸시되는 경우, 기존에 푸시되어있던 액티비티를 재활용합니다", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent3: PushedEvent;
  let pushedEvent4: PushedEvent;
  let pushedEvent5: PushedEvent;

  let poppedEvent1: PoppedEvent;
  let poppedEvent2: PoppedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
    (pushedEvent3 = makeEvent("Pushed", {
      activityId: "a3",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent4 = makeEvent("Pushed", {
      activityId: "a4",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (poppedEvent1 = makeEvent("Popped", {
      eventDate: enoughPastTime(),
    })),
    (poppedEvent2 = makeEvent("Popped", {
      eventDate: enoughPastTime(),
    })),
    makeEvent("Popped", {
      eventDate: enoughPastTime(),
    }),
    (pushedEvent5 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "home",
        transitionState: "enter-active",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent5,
          },
        ],
        enteredBy: pushedEvent5,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
      activity({
        id: "a3",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a3",
            params: {},
            enteredBy: pushedEvent3,
          },
        ],
        enteredBy: pushedEvent3,
        exitedBy: poppedEvent2,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "a4",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a4",
            params: {},
            enteredBy: pushedEvent4,
          },
        ],
        enteredBy: pushedEvent4,
        exitedBy: poppedEvent1,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - PushedEvent에 params가 담겨있는 경우 액티비티에 해당 params가 포함됩니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - ReplacedEvent가 발생한 직후 최상단의 Activity를 유지하면서 새 Activity가 추가됩니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;
  let replacedEvent: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    (replacedEvent = makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-active",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "world",
            },
            enteredBy: replacedEvent,
          },
        ],
        enteredBy: replacedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - ReplacedEvent가 발생한 후 transitionDuration만큼 지난 경우 기존 최상단 Activity의 상태를 exit-done으로 바꿉니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;
  let replacedEvent: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    (replacedEvent = makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t + 300);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "exit-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        exitedBy: replacedEvent,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "world",
            },
            enteredBy: replacedEvent,
          },
        ],
        enteredBy: replacedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - ReplacedEvent가 두 번 발생한 후 transitionDuration만큼 지난 경우 기존 최상단 Activity의 상태를 exit-done으로 바꿉니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;
  let replacedEvent1: ReplacedEvent;
  let replacedEvent2: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    (replacedEvent1 = makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    (replacedEvent2 = makeEvent("Replaced", {
      activityId: "a3",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t + 300);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "exit-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        exitedBy: replacedEvent1,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "exit-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "world",
            },
            enteredBy: replacedEvent1,
          },
        ],
        enteredBy: replacedEvent1,
        exitedBy: replacedEvent2,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "a3",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a3",
            params: {
              hello: "world",
            },
            enteredBy: replacedEvent2,
          },
        ],
        enteredBy: replacedEvent2,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - skipEnterActiveState가 true이면 eventDate가 transitionDuration을 충족하지 않아도 enter-done 상태가 됩니다.", () => {
  const t = nowTime();

  let pushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t - 150,
      skipEnterActiveState: true,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - skipExitActiveState가 true이면 eventDate가 transitionDuration을 충족하지 않아도 exit-done 상태가 됩니다. ", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;
  let poppedEvent: PoppedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "home",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "home",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (poppedEvent = makeEvent("Popped", {
      eventDate: t - 150,
      skipExitActiveState: true,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "home",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "home",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        exitedBy: poppedEvent,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
    ],
    registeredActivities: [
      {
        name: "home",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - skipExitActiveState가 true이면 ReplacedEvent가 발생한 직후 기존 최상단의 Activity는 바로 exit-done 상태가 되고 현재 최상단의 Activity는 바로 enter-done 상태가 됩니다.", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;
  let replacedEvent: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    (replacedEvent = makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      eventDate: t,
      activityParams: {
        hello: "world",
      },
      skipEnterActiveState: true,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "exit-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        exitedBy: replacedEvent,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "world",
            },
            enteredBy: replacedEvent,
          },
        ],
        enteredBy: replacedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - PushedEvent에 activityContext가 담겨있는 경우 액티비티에 해당 activityContext가 포함됩니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      eventDate: t,
      activityContext: {
        hello: "world",
      },
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent,
          },
        ],
        context: {
          hello: "world",
        },
        enteredBy: pushedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - ReplacedEvent에 activityContext가 담겨있는 경우 액티비티에 해당 activityContext가 포함됩니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;
  let replacedEvent: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {},
      activityContext: {
        hello: "world1",
      },
      eventDate: t,
    })),
    (replacedEvent = makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {},
      activityContext: {
        hello: "world2",
      },
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        steps: [
          {
            id: "a1",
            params: {},
            enteredBy: pushedEvent,
          },
        ],
        context: {
          hello: "world1",
        },
        enteredBy: pushedEvent,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-active",
        params: {},
        steps: [
          {
            id: "a2",
            params: {},
            enteredBy: replacedEvent,
          },
        ],
        context: {
          hello: "world2",
        },
        enteredBy: replacedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - ReplacedEvent에 현재 상단에 존재하는 activityId가 포함된 경우, 해당하는 액티비티가 전환효과 없이 변경됩니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;
  let replacedEvent: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    (replacedEvent = makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world2",
      },
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world2",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "world2",
            },
            enteredBy: replacedEvent,
          },
        ],
        enteredBy: replacedEvent,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - ReplacedEvent에 현재 중간에 존재하는 activityId가 포함된 경우, 해당 액티비티가 전환효과 없이 변경됩니다", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent3: PushedEvent;
  let replacedEvent: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    (pushedEvent3 = makeEvent("Pushed", {
      activityId: "a3",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    (replacedEvent = makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world2",
      },
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world2",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "world2",
            },
            enteredBy: replacedEvent,
          },
        ],
        enteredBy: replacedEvent,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: 1,
      }),
      activity({
        id: "a3",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a3",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent3,
          },
        ],
        enteredBy: pushedEvent3,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 2,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - ReplacedEvent에 현재 중간에 존재하는 activityId가 포함되고 충분한 시간이 지난 경우, 해당 액티비티가 enter-done 상태를 유지합니다", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent3: PushedEvent;
  let replacedEvent: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    }),
    (pushedEvent3 = makeEvent("Pushed", {
      activityId: "a3",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    (replacedEvent = makeEvent("Replaced", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world2",
      },
      eventDate: enoughPastTime(),
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world2",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "world2",
            },
            enteredBy: replacedEvent,
          },
        ],
        enteredBy: replacedEvent,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: 1,
      }),
      activity({
        id: "a3",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a3",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent3,
          },
        ],
        enteredBy: pushedEvent3,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 2,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - ReplacedEvent가 같은 activityId로 여러번 수행되었을때도 정상 작동합니다", () => {
  const t = 1667218241499;

  let poppedEvent: PoppedEvent;

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
    (poppedEvent = {
      id: "97a1f31ad18c",
      name: "Popped" as const,
      eventDate: 1667218241499,
    }),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      {
        id: "97a1f1f11a50",
        name: "Main",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "97a1f1f11a50",
            params: {},
            enteredBy: {
              id: "97a1f1f11a51",
              name: "Pushed",
              eventDate: 1667217986388,
              activityId: "97a1f1f11a50",
              activityName: "Main",
              activityParams: {},
              activityContext: { path: "/" },
            },
          },
        ],
        enteredBy: {
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
        isRoot: true,
        zIndex: 0,
        context: { path: "/" },
      },
      {
        id: "97a1f315c944",
        name: "Article",
        transitionState: "exit-active",
        params: { articleId: "02542470", title: "Master", referrer: "my" },
        steps: [
          {
            id: "97a1f315c944",
            params: { articleId: "02542470", title: "Master", referrer: "my" },
            enteredBy: {
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
          },
        ],
        enteredBy: {
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
        exitedBy: poppedEvent,
        isTop: true,
        isActive: false,
        isRoot: false,
        zIndex: 1,
        context: { path: "/articles/02542470/?title=Master&referrer=my" },
      },
    ],
    registeredActivities: [
      {
        name: "Main",
      },
      {
        name: "Article",
      },
    ],
    transitionDuration: 350,
    globalTransitionState: "loading",
  });
});

test("aggregate - 현재 특정 액티비티가 애니메이션 되고 있는 상태라면, Replaced 이벤트가 들어와도 전환을 지속합니다", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let replacedEvent: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    makeEvent("Pushed", {
      activityId: "a3",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t - 150,
    }),
    (replacedEvent = makeEvent("Replaced", {
      activityId: "a3",
      activityName: "sample",
      activityParams: {
        hello: "world2",
      },
      eventDate: t - 50,
      skipEnterActiveState: true,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a3",
        name: "sample",
        transitionState: "enter-active",
        params: {
          hello: "world2",
        },
        steps: [
          {
            id: "a3",
            params: {
              hello: "world2",
            },
            enteredBy: replacedEvent,
          },
        ],
        enteredBy: replacedEvent,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - 현재 특정 액티비티가 애니메이션이 되고 있는 상태에서, Replaced 이벤트가 들어왔고, 이전 애니메이션이 끝난 경우 전환이 끝납니다", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let replacedEvent: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    makeEvent("Pushed", {
      activityId: "a3",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: t - 400,
    }),
    (replacedEvent = makeEvent("Replaced", {
      activityId: "a3",
      activityName: "sample",
      activityParams: {
        hello: "world2",
      },
      eventDate: t - 200,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a2",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a3",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world2",
        },
        steps: [
          {
            id: "a3",
            params: {
              hello: "world2",
            },
            enteredBy: replacedEvent,
          },
        ],
        enteredBy: replacedEvent,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - StepPushedEvent가 발생하면, 최상단 액티비티의 파라미터가 변경됩니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;
  let stepPushedEvent: StepPushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    (stepPushedEvent = makeEvent("StepPushed", {
      stepId: "s1",
      stepParams: {
        hello: "world2",
      },
      eventDate: enoughPastTime(),
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world2",
        },
        enteredBy: pushedEvent,
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent,
          },
          {
            id: "s1",
            params: {
              hello: "world2",
            },
            enteredBy: stepPushedEvent,
          },
        ],
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - StepPushedEvent가 쌓인 상태에서, StepPoppedEvent가 들어오면, 다시 이전 파라미터로 돌아갑니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    makeEvent("StepPushed", {
      stepId: "s1",
      stepParams: {
        hello: "world2",
      },
      eventDate: enoughPastTime(),
    }),
    makeEvent("StepPopped", {
      eventDate: enoughPastTime(),
    }),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world",
        },
        enteredBy: pushedEvent,
        steps: [
          {
            id: "a1",
            params: {
              hello: "world",
            },
            enteredBy: pushedEvent,
          },
        ],
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - StepPushedEvent가 쌓인 상태에서, PoppedEvent가 들어오면, 쌓여진 StepPushedEvent들을 넘어서서 액티비티가 삭제됩니다", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;
  let poppedEvent: PoppedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "a",
      },
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "b",
      },
      eventDate: enoughPastTime(),
    })),
    makeEvent("StepPushed", {
      stepId: "s1",
      stepParams: {
        hello: "c",
      },
      eventDate: enoughPastTime(),
    }),
    (poppedEvent = makeEvent("Popped", {
      eventDate: enoughPastTime(),
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "a",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "a",
            },
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "exit-done",
        params: {
          hello: "b",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "b",
            },
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        exitedBy: poppedEvent,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - StepPushedEvent가 쌓인 상태에서, PoppedEvent가 들어오면, 나가고있는 동안에는 이전 파라미터를 유지합니다", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;
  let stepPushedEvent: StepPushedEvent;
  let poppedEvent: PoppedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "a",
      },
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "a2",
      activityName: "sample",
      activityParams: {
        hello: "b",
      },
      eventDate: enoughPastTime(),
    })),
    (stepPushedEvent = makeEvent("StepPushed", {
      stepId: "s1",
      stepParams: {
        hello: "c",
      },
      eventDate: enoughPastTime(),
    })),
    (poppedEvent = makeEvent("Popped", {
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "a",
        },
        steps: [
          {
            id: "a1",
            params: {
              hello: "a",
            },
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: true,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "a2",
        name: "sample",
        transitionState: "exit-active",
        params: {
          hello: "c",
        },
        steps: [
          {
            id: "a2",
            params: {
              hello: "b",
            },
            enteredBy: pushedEvent2,
          },
          {
            id: "s1",
            params: {
              hello: "c",
            },
            enteredBy: stepPushedEvent,
          },
        ],
        enteredBy: pushedEvent2,
        exitedBy: poppedEvent,
        isActive: false,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

test("aggregate - StepReplacedEvent가 발생하면, 최상단 액티비티의 파라미터가 변경됩니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;
  let stepReplacedEvent: StepReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    (stepReplacedEvent = makeEvent("StepReplaced", {
      stepId: "s1",
      stepParams: {
        hello: "world2",
      },
      eventDate: enoughPastTime(),
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world2",
        },
        enteredBy: pushedEvent,
        steps: [
          {
            id: "s1",
            params: {
              hello: "world2",
            },
            enteredBy: stepReplacedEvent,
          },
        ],
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - 만약 StepPoppedEvent를 통해 제거할 수 있는 영역이 없는 경우, 아무것도 하지 않습니다", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;
  let stepReplacedEvent: StepReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "a1",
      activityName: "sample",
      activityParams: {
        hello: "world",
      },
      eventDate: enoughPastTime(),
    })),
    (stepReplacedEvent = makeEvent("StepReplaced", {
      stepId: "s1",
      stepParams: {
        hello: "world2",
      },
      eventDate: enoughPastTime(),
    })),
    makeEvent("StepPopped", {
      eventDate: enoughPastTime(),
    }),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "a1",
        name: "sample",
        transitionState: "enter-done",
        params: {
          hello: "world2",
        },
        enteredBy: pushedEvent,
        steps: [
          {
            id: "s1",
            params: {
              hello: "world2",
            },
            enteredBy: stepReplacedEvent,
          },
        ],
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - RegisteredActivityEvent에 paramsSchema가 있다면 registeredActivities에 표현됩니다", () => {
  const t = nowTime();

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
      activityParamsSchema: {
        type: "object",
        properties: {
          hello: {
            type: "string",
          },
        },
        required: ["hello"],
      },
    }),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [],
    registeredActivities: [
      {
        name: "sample",
        paramsSchema: {
          type: "object",
          properties: {
            hello: {
              type: "string",
            },
          },
          required: ["hello"],
        },
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - After Push > Replace > Replace (skipped), first pushed activity should be exit-done", () => {
  const t = nowTime();

  let pushedEvent: PushedEvent;
  let replacedEvent1: ReplacedEvent;
  let replacedEvent2: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent = makeEvent("Pushed", {
      activityId: "A",
      activityName: "sample",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (replacedEvent1 = makeEvent("Replaced", {
      activityId: "B",
      activityName: "sample",
      activityParams: {},
      eventDate: t,
    })),
    (replacedEvent2 = makeEvent("Replaced", {
      activityId: "C",
      activityName: "sample",
      activityParams: {},
      eventDate: t + 50,
      skipEnterActiveState: true,
    })),
  ];

  const output = aggregate(events, t);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "A",
        name: "sample",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "A",
            params: {},
            enteredBy: pushedEvent,
          },
        ],
        enteredBy: pushedEvent,
        exitedBy: replacedEvent2,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "B",
        name: "sample",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "B",
            params: {},
            enteredBy: replacedEvent1,
          },
        ],
        enteredBy: replacedEvent1,
        exitedBy: replacedEvent2,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "C",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "C",
            params: {},
            enteredBy: replacedEvent2,
          },
        ],
        enteredBy: replacedEvent2,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - After Push > Push > Replace > Replace, first pushed activity should be enter-done", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;
  let replacedEvent1: ReplacedEvent;
  let replacedEvent2: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "A",
      activityName: "sample",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "B",
      activityName: "sample",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (replacedEvent1 = makeEvent("Replaced", {
      activityId: "C",
      activityName: "sample",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (replacedEvent2 = makeEvent("Replaced", {
      activityId: "D",
      activityName: "sample",
      activityParams: {},
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t + 300);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "A",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "A",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "B",
        name: "sample",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "B",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        exitedBy: replacedEvent1,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "C",
        name: "sample",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "C",
            params: {},
            enteredBy: replacedEvent1,
          },
        ],
        enteredBy: replacedEvent1,
        exitedBy: replacedEvent2,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "D",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "D",
            params: {},
            enteredBy: replacedEvent2,
          },
        ],
        enteredBy: replacedEvent2,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - After Push > Push > Pop > Replace, first pushed activity should be replaced", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;
  let poppedEvent1: PoppedEvent;
  let replacedEvent1: ReplacedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "A",
      activityName: "sample",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "B",
      activityName: "sample",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (poppedEvent1 = makeEvent("Popped", {
      eventDate: enoughPastTime(),
    })),
    (replacedEvent1 = makeEvent("Replaced", {
      activityId: "C",
      activityName: "sample",
      activityParams: {},
      eventDate: t,
    })),
  ];

  const output = aggregate(events, t + 300);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "A",
        name: "sample",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "A",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        exitedBy: replacedEvent1,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "B",
        name: "sample",
        transitionState: "exit-done",
        params: {},
        steps: [
          {
            id: "B",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        exitedBy: poppedEvent1,
        isActive: false,
        isTop: false,
        isRoot: false,
        zIndex: -1,
      }),
      activity({
        id: "C",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "C",
            params: {},
            enteredBy: replacedEvent1,
          },
        ],
        enteredBy: replacedEvent1,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - StepPushedEvent must be ignored when top activity is not target activity", () => {
  const t = nowTime();

  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;
  let stepPushedEvent: StepPushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "sample",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "A",
      activityName: "sample",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "B",
      activityName: "sample",
      activityParams: {},
      eventDate: enoughPastTime(),
    })),
    (stepPushedEvent = makeEvent("StepPushed", {
      stepId: "s1",
      stepParams: {},
      targetActivityId: pushedEvent1.activityId,
      eventDate: enoughPastTime(),
    })),
  ];

  const output = aggregate(events, t + 300);

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "A",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "A",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "B",
        name: "sample",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "B",
            params: {},
            enteredBy: pushedEvent2,
          },
        ],
        enteredBy: pushedEvent2,
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "sample",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "idle",
  });
});

test("aggregate - Pause되면 이벤트가 반영되지 않고, globalTransitionState를 paused으로 바꿉니다", () => {
  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "a",
    }),
    registeredEvent({
      activityName: "b",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "activity-1",
      activityName: "a",
      eventDate: enoughPastTime(),
      activityParams: {},
    })),
    makeEvent("Paused", {}),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "activity-2",
      activityName: "b",
      activityParams: {},
    })),
  ];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "activity-1",
        name: "a",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "activity-1",
            params: {},
            enteredBy: pushedEvent1,
          },
        ],
        enteredBy: pushedEvent1,
        isActive: true,
        isTop: true,
        isRoot: true,
        zIndex: 0,
      }),
    ],
    registeredActivities: [
      {
        name: "a",
      },
      {
        name: "b",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "paused",
  });
});

test("aggregate - Resumed 되면 해당 시간 이후로 Transition이 정상작동합니다", () => {
  let pushedEvent1: PushedEvent;
  let pushedEvent2: PushedEvent;

  const events = [
    initializedEvent({
      transitionDuration: 300,
    }),
    registeredEvent({
      activityName: "a",
    }),
    registeredEvent({
      activityName: "b",
    }),
    (pushedEvent1 = makeEvent("Pushed", {
      activityId: "activity-1",
      activityName: "a",
      eventDate: enoughPastTime(),
      activityParams: {},
    })),
    makeEvent("Paused", {
      eventDate: enoughPastTime(),
    }),
    (pushedEvent2 = makeEvent("Pushed", {
      activityId: "activity-2",
      activityName: "b",
      eventDate: enoughPastTime(),
      activityParams: {},
    })),
    makeEvent("Resumed", {
      eventDate: nowTime() - 150,
    }),
  ];

  const output = aggregate(events, nowTime());

  expect(output).toStrictEqual({
    activities: [
      activity({
        id: "activity-1",
        name: "a",
        transitionState: "enter-done",
        params: {},
        steps: [
          {
            id: "activity-1",
            params: {},
            enteredBy: expect.anything(),
          },
        ],
        enteredBy: expect.anything(),
        isActive: false,
        isTop: false,
        isRoot: true,
        zIndex: 0,
      }),
      activity({
        id: "activity-2",
        name: "b",
        transitionState: "enter-active",
        params: {},
        steps: [
          {
            id: "activity-2",
            params: {},
            enteredBy: expect.anything(),
          },
        ],
        enteredBy: expect.anything(),
        isActive: true,
        isTop: true,
        isRoot: false,
        zIndex: 1,
      }),
    ],
    registeredActivities: [
      {
        name: "a",
      },
      {
        name: "b",
      },
    ],
    transitionDuration: 300,
    globalTransitionState: "loading",
  });
});

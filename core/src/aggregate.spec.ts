import { aggregate } from "./aggregate";
import { makeEvent } from "./event-utils";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const nowDate = () => new Date();
const enoughNextDate = () => new Date(Date.now() + MINUTE);

const initializedEvent = ({
  transitionDuration,
}: {
  transitionDuration: number;
}) => makeEvent("Initialized", { transitionDuration });

const registeredEvent = ({ activityName }: { activityName: string }) =>
  makeEvent("ActivityRegistered", {
    activityName,
  });

test("aggregate - 만약에 InitializedEvent만 존재하는 경우, 빈 스택을 내려줍니다", () => {
  const output = aggregate(
    [
      initializedEvent({
        transitionDuration: 300,
      }),
    ],
    enoughNextDate().getTime(),
  );

  expect(output).toStrictEqual({
    activities: [],
    transition: {
      state: "idle",
    },
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
      }),
    ],
    enoughNextDate().getTime(),
  );

  expect(output).toStrictEqual({
    activities: [
      {
        activityId: "a1",
        activityName: "sample",
        transition: {
          state: "enter-done",
        },
      },
    ],
    transition: {
      state: "idle",
    },
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
      }),
    ],
    enoughNextDate().getTime(),
  );

  expect(output).toStrictEqual({
    activities: [
      {
        activityId: "a2",
        activityName: "sample2",
        transition: {
          state: "enter-done",
        },
      },
    ],
    transition: {
      state: "idle",
    },
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
        }),
        makeEvent("Pushed", {
          activityId: "a1",
          activityName: "sample2",
        }),
      ],
      enoughNextDate().getTime(),
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
      }),
      makeEvent("Pushed", {
        activityId: "a2",
        activityName: "home",
      }),
    ],
    enoughNextDate().getTime(),
  );

  expect(output).toStrictEqual({
    activities: [
      {
        activityId: "a1",
        activityName: "sample2",
        transition: {
          state: "enter-done",
        },
      },
      {
        activityId: "a2",
        activityName: "home",
        transition: {
          state: "enter-done",
        },
      },
    ],
    transition: {
      state: "idle",
    },
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
      }),
      makeEvent("Pushed", {
        activityId: "a2",
        activityName: "sample2",
      }),
    ],
    enoughNextDate().getTime(),
  );

  expect(output).toStrictEqual({
    activities: [
      {
        activityId: "a1",
        activityName: "sample2",
        transition: {
          state: "enter-done",
        },
      },
      {
        activityId: "a2",
        activityName: "sample2",
        transition: {
          state: "enter-done",
        },
      },
    ],
    transition: {
      state: "idle",
    },
  });
});

test("aggregate - 푸시한 직후에는 transition.state가 loading 입니다", () => {
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
      }),
    ],
    nowDate().getTime(),
  );

  expect(output).toStrictEqual({
    activities: [
      {
        activityId: "a1",
        activityName: "sample",
        transition: {
          state: "enter-active",
        },
      },
    ],
    transition: {
      state: "loading",
    },
  });
});

test("aggregate - 현재 시간과 변화된 시간의 차가 InitializedEvent의 transitionDuration 보다 작다면 transition.state가 loading 입니다", () => {
  const nowTime = nowDate().getTime();

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
        eventDate: nowTime - 150,
      }),
    ],
    nowTime,
  );

  expect(output).toStrictEqual({
    activities: [
      {
        activityId: "a1",
        activityName: "sample",
        transition: {
          state: "enter-active",
        },
      },
    ],
    transition: {
      state: "loading",
    },
  });
});

test("aggregate - 푸시한 이후 InitializedEvent에서 셋팅된 transitionDuration만큼 정확하게 지난 경우 transition.state가 idle 입니다", () => {
  const eventDate = new Date().getTime();
  const transitionDuration = 300;

  const output = aggregate(
    [
      initializedEvent({
        transitionDuration,
      }),
      registeredEvent({
        activityName: "sample",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "sample",
        eventDate,
      }),
    ],
    eventDate + transitionDuration,
  );

  expect(output).toStrictEqual({
    activities: [
      {
        activityId: "a1",
        activityName: "sample",
        transition: {
          state: "enter-done",
        },
      },
    ],
    transition: {
      state: "idle",
    },
  });
});

test("aggregate - 여러번 푸시한 경우, transitionDuration 전에 푸시한 Activity의 transition.state는 enter-done, 그 이후 푸시한 Activity는 enter-active 입니다", () => {
  const nowTime = nowDate().getTime();

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
        eventDate: nowTime - 350,
      }),
      makeEvent("Pushed", {
        activityId: "a2",
        activityName: "sample",
        eventDate: nowTime - 150,
      }),
    ],
    nowTime,
  );

  expect(output).toStrictEqual({
    activities: [
      {
        activityId: "a1",
        activityName: "sample",
        transition: {
          state: "enter-done",
        },
      },
      {
        activityId: "a2",
        activityName: "sample",
        transition: {
          state: "enter-active",
        },
      },
    ],
    transition: {
      state: "loading",
    },
  });
});

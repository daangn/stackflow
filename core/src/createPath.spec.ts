import type { PushedEvent, StepPushedEvent } from "./event-types";
import { makeEvent } from "./event-utils";
import type { StackflowPlugin, StackInitInfo } from "./interfaces";
import { makeCoreStore } from "./makeCoreStore";
import type { SnapshotEvent, StackSnapshot } from "./StackSnapshot";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;

const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

const nullProvider = (snapshot: StackSnapshot | null = null): StackflowPlugin =>
  () => ({
    key: "provider",
    provideSnapshot: () => snapshot,
  });

test("create - 스냅샷 공급자가 없으면 initialEvents로 create 경로를 재구성합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [],
  });

  const stack = actions.getStack();
  const a1 = stack.activities.find((a) => a.id === "a1");

  expect(a1?.transitionState).toEqual("enter-done");
  expect(a1?.isActive).toBe(true);
  expect(a1?.isTop).toBe(true);
  expect(a1?.isRoot).toBe(true);
  expect(stack.globalTransitionState).toEqual("idle");
});

test('create - provideSnapshot 전원 null이면 create 경로를 타고 initInfo.kind가 "create"입니다', () => {
  const onInit = jest.fn();

  const store = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [nullProvider(), () => ({ key: "observer", onInit })],
  });

  store.init();

  expect(store.actions.getStack().activities.map((a) => a.id)).toEqual(["a1"]);
  expect(onInit).toHaveBeenCalledTimes(1);
  expect(onInit.mock.calls[0][0].initInfo).toEqual({ kind: "create" });
});

test('create - overrideInitialEvents가 onInit과 동일한 형태의 initInfo { kind: "create" }를 전달받습니다', () => {
  const overrideInitialEvents = jest.fn(
    (args: {
      initialEvents: SnapshotEvent[];
      initialContext: any;
      initInfo: StackInitInfo;
    }) => args.initialEvents,
  );

  makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [() => ({ key: "observer", overrideInitialEvents })],
  });

  expect(overrideInitialEvents).toHaveBeenCalledTimes(1);
  expect(overrideInitialEvents.mock.calls[0][0].initInfo).toEqual({
    kind: "create",
  });
});

test("create - overrideInitialEvents가 초기 진입을 전부 strip하면 onInitialActivityNotFound가 발화하고 빈 스택입니다", () => {
  const onInitialActivityNotFound = jest.fn();

  const { actions } = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      () => ({
        key: "stripper",
        overrideInitialEvents: () => [],
      }),
    ],
    handlers: {
      onInitialActivityNotFound,
    },
  });

  expect(onInitialActivityNotFound).toHaveBeenCalledTimes(1);
  expect(actions.getStack().activities).toHaveLength(0);
});

test("create - overrideInitialEvents가 초기 이벤트 참조를 바꾸면 onInitialActivityIgnored가 발화합니다", () => {
  const onInitialActivityIgnored = jest.fn();

  makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      () => ({
        key: "replacer",
        overrideInitialEvents: (): (PushedEvent | StepPushedEvent)[] => [
          makeEvent("Pushed", {
            activityId: "a2",
            activityName: "hello",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ],
      }),
    ],
    handlers: {
      onInitialActivityIgnored,
    },
  });

  expect(onInitialActivityIgnored).toHaveBeenCalledTimes(1);
});

test("create - overrideInitialEvents에서 초기 Pushed를 strip하면 해당 activity가 스택에 없습니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "A",
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "B",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "A",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "b1",
        activityName: "B",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      () => ({
        key: "stripper",
        overrideInitialEvents: ({ initialEvents }) =>
          initialEvents.filter(
            (e) => !(e.name === "Pushed" && e.activityId === "a1"),
          ),
      }),
    ],
  });

  const ids = actions.getStack().activities.map((a) => a.id);
  expect(ids).toContain("b1");
  expect(ids).not.toContain("a1");
});

test("create - overrideInitialEvents에서 초기 Pushed를 치환하면 치환된 activity로 진입합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "A",
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "Redirect",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "A",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      () => ({
        key: "redirector",
        overrideInitialEvents: (): (PushedEvent | StepPushedEvent)[] => [
          makeEvent("Pushed", {
            activityId: "redirect",
            activityName: "Redirect",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ],
      }),
    ],
  });

  const ids = actions.getStack().activities.map((a) => a.id);
  expect(ids).toContain("redirect");
  expect(ids).not.toContain("a1");
});

test("create - 생성 중에는 어떤 post-effect 훅(onPushed·onChanged 등)도 발화하지 않습니다", () => {
  const onPushed = jest.fn();
  const onReplaced = jest.fn();
  const onChanged = jest.fn();

  const store = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      () => ({
        key: "observer",
        onPushed,
        onReplaced,
        onChanged,
      }),
    ],
  });

  store.init();

  expect(onPushed).toHaveBeenCalledTimes(0);
  expect(onReplaced).toHaveBeenCalledTimes(0);
  expect(onChanged).toHaveBeenCalledTimes(0);
});

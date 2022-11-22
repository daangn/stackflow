import { createCoreStore } from "./createCoreStore";
import { makeEvent } from "./event-utils";
import type { StackflowPlugin } from "./interfaces";
import { last } from "./utils";

test("createCoreStore - beforePush 훅이 정상적으로 동작합니다", () => {
  const onBeforePush = jest.fn();
  const otherHook = jest.fn();

  const { coreActions } = createCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
      }),
    ],
    plugins: [
      () => ({
        key: "test",
        onBeforePush,
        onBeforeReplace: otherHook,
        onBeforePop: otherHook,
      }),
    ],
  });

  coreActions.push({
    activityId: "a2",
    activityName: "hello",
    activityParams: {},
  });

  expect(onBeforePush).toHaveBeenCalledTimes(1);
  expect(otherHook).toHaveBeenCalledTimes(0);
});

test("createCoreStore - Pushed 훅이 정상적으로 작동합니다", () => {
  const onPushed = jest.fn();
  const otherHook = jest.fn();

  const { coreActions } = createCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
      }),
    ],
    plugins: [
      () => ({
        key: "test",
        onPushed,
        onReplaced: otherHook,
        onPopped: otherHook,
      }),
    ],
  });

  coreActions.push({
    activityId: "a2",
    activityName: "hello",
    activityParams: {},
  });

  const stack = coreActions.getStack();

  expect(last(stack.activities)?.id).toEqual("a2");
  expect(onPushed).toHaveBeenCalledTimes(1);
  expect(otherHook).toHaveBeenCalledTimes(0);
});

test("createCoreStore - onBeforePush 훅에서 preventDefault가 호출되면, 기본 동작을 멈춥니다", () => {
  const onBeforePush: ReturnType<StackflowPlugin>["onBeforePush"] = jest.fn(
    ({ actions }) => {
      actions.preventDefault();
    },
  );
  const onPushed = jest.fn();
  const otherHook = jest.fn();

  const { coreActions } = createCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 350,
      }),
      makeEvent("ActivityRegistered", {
        activityName: "hello",
      }),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "hello",
        activityParams: {},
      }),
    ],
    plugins: [
      () => ({
        key: "test",
        onBeforePush,
        onBeforeReplace: otherHook,
        onBeforePop: otherHook,
        onPushed,
        onReplaced: otherHook,
        onPopped: otherHook,
      }),
    ],
  });

  coreActions.push({
    activityId: "a2",
    activityName: "hello",
    activityParams: {},
  });

  const stack = coreActions.getStack();

  expect(last(stack.activities)?.id).toEqual("a1");
  expect(onBeforePush).toHaveBeenCalledTimes(1);
  expect(onPushed).toHaveBeenCalledTimes(0);
  expect(otherHook).toHaveBeenCalledTimes(0);
});

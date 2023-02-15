import { makeCoreStore, makeEvent } from "@stackflow/core";
import type { Location } from "history";
import { createMemoryHistory } from "history";

import { historySyncPlugin } from "./historySyncPlugin";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;
const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

const path = (location: Location) => location.pathname + location.search;

test("historySyncPlugin - 초기에 매칭하는 라우트가 없는 경우 fallbackActivity에 설정한 액티비티의 라우트로 이동합니다", () => {
  const history = createMemoryHistory();

  const plugin = historySyncPlugin({
    history,
    routes: {
      Hello: "/hello",
      World: "/world",
    },
    fallbackActivity: () => "Hello",
  });

  const pluginInstance = plugin();

  const coreStore = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 3000,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "Hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "World",
        eventDate: enoughPastTime(),
      }),
      ...(pluginInstance.overrideInitialEvents?.({
        initialContext: {},
        initialEvents: [],
      }) ?? []),
    ],
    plugins: [plugin],
  });

  coreStore.init();

  expect(path(history.location)).toEqual("/hello/");
});

test("historySyncPlugin - actions.push() 후에, 히스토리의 Path가 알맞게 바뀝니다", () => {
  const history = createMemoryHistory();

  const plugin = historySyncPlugin({
    history,
    routes: {
      Hello: "/hello",
      World: "/world/:param1",
    },
    fallbackActivity: () => "Hello",
  });

  const pluginInstance = plugin();

  const coreStore = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 3000,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "Hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "World",
        eventDate: enoughPastTime(),
      }),
      ...(pluginInstance.overrideInitialEvents?.({
        initialContext: {},
        initialEvents: [],
      }) ?? []),
    ],
    plugins: [plugin],
  });

  coreStore.init();

  coreStore.actions.push({
    activityId: "a1",
    activityName: "World",
    activityParams: {
      param1: "foo",
      param2: "bar",
    },
  });

  expect(path(history.location)).toEqual("/world/foo/?param2=bar");
});

test("historySyncPlugin - 히스토리를 pop하는 경우, activity 상태가 바뀝니다", () => {
  const history = createMemoryHistory();

  const plugin = historySyncPlugin({
    history,
    routes: {
      Hello: "/hello",
      World: "/world/:param1",
    },
    fallbackActivity: () => "Hello",
  });

  const pluginInstance = plugin();

  const coreStore = makeCoreStore({
    initialEvents: [
      makeEvent("Initialized", {
        transitionDuration: 3000,
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "Hello",
        eventDate: enoughPastTime(),
      }),
      makeEvent("ActivityRegistered", {
        activityName: "World",
        eventDate: enoughPastTime(),
      }),
      ...(pluginInstance.overrideInitialEvents?.({
        initialContext: {},
        initialEvents: [],
      }) ?? []),
    ],
    plugins: [plugin],
  });

  coreStore.init();

  coreStore.actions.push({
    activityId: "a1",
    activityName: "World",
    activityParams: {
      param1: "foo",
      param2: "bar",
    },
  });

  expect(path(history.location)).toEqual("/world/foo/?param2=bar");

  history.back();

  const activeActivity = coreStore.actions
    .getStack()
    .activities.find((a) => a.isActive);

  expect(activeActivity?.name).toEqual("Hello");
});

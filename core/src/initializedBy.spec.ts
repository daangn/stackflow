import type { DomainEvent } from "./event-types";
import { makeEvent } from "./event-utils";
import type { StackflowPlugin } from "./interfaces";
import { makeCoreStore } from "./makeCoreStore";
import type { NavigationEvent, StackSnapshot } from "./StackSnapshot";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;

const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

const config = (activityNames: string[]): DomainEvent[] => [
  makeEvent("Initialized", {
    transitionDuration: 350,
    eventDate: enoughPastTime(),
  }),
  ...activityNames.map((activityName) =>
    makeEvent("ActivityRegistered", {
      activityName,
      eventDate: enoughPastTime(),
    }),
  ),
];

const provideSnapshotPlugin = (
  events: NavigationEvent[],
  extra?: Partial<ReturnType<StackflowPlugin>>,
): StackflowPlugin => {
  return () => ({
    key: "provider",
    provideSnapshot: (): StackSnapshot => ({
      $schema: "stackflow.snapshot.v1",
      events,
    }),
    ...extra,
  });
};

/** The ten existing domain events — the snapshot mechanism adds none. */
const DOMAIN_EVENT_NAMES = new Set([
  "Initialized",
  "ActivityRegistered",
  "Pushed",
  "Replaced",
  "Popped",
  "StepPushed",
  "StepReplaced",
  "StepPopped",
  "Paused",
  "Resumed",
]);

test('initializedBy - create 경로에서 onInit의 initializedBy가 "create"입니다', () => {
  const onInit = jest.fn();

  const store = makeCoreStore({
    initialEvents: [
      ...config(["A"]),
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "A",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [() => ({ key: "observer", onInit })],
  });

  store.init();

  expect(onInit.mock.calls[0][0].initializedBy).toEqual("create");
});

test("initializedBy - load 후 구분 신호가 Stack 상태·이벤트 로그에 남지 않고 복원 activity의 enteredBy는 원본 이벤트입니다", () => {
  const store = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [
      provideSnapshotPlugin([
        makeEvent("Pushed", {
          id: "ep",
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: enoughPastTime(),
        }),
        makeEvent("Replaced", {
          id: "er",
          activityId: "b1",
          activityName: "B",
          activityParams: {},
          eventDate: enoughPastTime(),
        }),
      ]),
    ],
  });

  // No new domain-event vocabulary leaks into the event log.
  expect(
    store.pullEvents().every((e) => DOMAIN_EVENT_NAMES.has(e.name)),
  ).toBe(true);

  // The restored top activity keeps the original Replaced event as enteredBy —
  // no "Loaded"-style marking, id preserved.
  const top = store.actions.getStack().activities.find((a) => a.isTop);
  expect(top?.enteredBy?.name).toEqual("Replaced");
  expect(top?.enteredBy?.id).toEqual("er");
});

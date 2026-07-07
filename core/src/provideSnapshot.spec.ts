import { makeEvent } from "./event-utils";
import type { StackflowPlugin } from "./interfaces";
import { makeCoreStore } from "./makeCoreStore";
import { SnapshotLoadError } from "./SnapshotLoadError";
import type { StackSnapshot } from "./StackSnapshot";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;

const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

const staticEvents = () => [
  makeEvent("Initialized", {
    transitionDuration: 350,
    eventDate: enoughPastTime(),
  }),
  makeEvent("ActivityRegistered", {
    activityName: "A",
    eventDate: enoughPastTime(),
  }),
];

const snapshotOf = (activityId: string): StackSnapshot => ({
  $schema: "stackflow.snapshot.v1",
  events: [
    makeEvent("Pushed", {
      activityId,
      activityName: "A",
      activityParams: {},
      eventDate: enoughPastTime(),
    }),
  ],
});

type OnLoadError = ReturnType<StackflowPlugin>["onLoadError"];

const provider = (
  key: string,
  snapshot: StackSnapshot | null,
  onLoadError?: OnLoadError,
): StackflowPlugin => {
  return () => ({
    key,
    provideSnapshot: () => snapshot,
    ...(onLoadError ? { onLoadError } : null),
  });
};

test("provideSnapshot - non-null 공급이 2개 이상이면 충돌 key를 명시한 생성 에러를 던집니다", () => {
  // Distinctive keys so message assertions cannot pass on an incidental
  // substring of a generic error message.
  const runWith = (keys: [string, string]) => {
    const onLoadErrorAlpha = jest.fn();
    const onLoadErrorBravo = jest.fn();

    let caught: unknown;
    try {
      makeCoreStore({
        initialEvents: staticEvents(),
        plugins: [
          provider(keys[0], snapshotOf("a1"), onLoadErrorAlpha),
          provider(keys[1], snapshotOf("a2"), onLoadErrorBravo),
        ],
      });
    } catch (error) {
      caught = error;
    }

    return { caught, onLoadErrorAlpha, onLoadErrorBravo };
  };

  for (const keys of [
    ["providerAlpha", "providerBravo"],
    ["providerBravo", "providerAlpha"],
  ] as [string, string][]) {
    const { caught, onLoadErrorAlpha, onLoadErrorBravo } = runWith(keys);

    // A wiring bug (two suppliers), not a specific snapshot's defect: a plain
    // creation Error, not SnapshotLoadError, and not routed to onLoadError.
    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBeInstanceOf(SnapshotLoadError);
    expect((caught as Error).message).toContain("providerAlpha");
    expect((caught as Error).message).toContain("providerBravo");
    expect(onLoadErrorAlpha).toHaveBeenCalledTimes(0);
    expect(onLoadErrorBravo).toHaveBeenCalledTimes(0);
  }
});

test("provideSnapshot - non-null 공급이 정확히 1개면 나머지 null은 무시하고 load합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: staticEvents(),
    plugins: [
      provider("first", null),
      provider("second", snapshotOf("a1")),
      provider("third", null),
    ],
  });

  const restored = actions
    .getStack()
    .activities.find((a) => a.id === "a1");

  expect(restored?.name).toEqual("A");
  expect(restored?.transitionState).toEqual("enter-done");
});

test("provideSnapshot - undefined 반환을 null과 동일하게(공급 없음) 취급합니다", () => {
  const undefinedProvider: StackflowPlugin = () => ({
    key: "provider",
    // Simulates a JS provider (e.g. optional chaining) that yields `undefined`
    // at runtime; core must treat it like `null` — nothing to provide.
    provideSnapshot: () => undefined as unknown as StackSnapshot | null,
  });

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
      makeEvent("Pushed", {
        activityId: "created",
        activityName: "A",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [undefinedProvider],
  });

  const activities = actions.getStack().activities;

  // Create path: the option's initial activity is present, no snapshot loaded.
  expect(activities.map((a) => a.id)).toEqual(["created"]);
});

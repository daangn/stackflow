import type { DomainEvent } from "./event-types";
import { makeEvent } from "./event-utils";
import type { StackflowPlugin, StackInitInfo } from "./interfaces";
import { makeCoreStore } from "./makeCoreStore";
import { SnapshotLoadError } from "./SnapshotLoadError";
import type {
  NavigationEvent,
  SnapshotEvent,
  StackSnapshot,
} from "./StackSnapshot";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

let dt = 0;

const enoughPastTime = () => {
  dt += 1;
  return new Date(Date.now() - MINUTE).getTime() + dt;
};

/** Static config events (Initialized + one ActivityRegistered per name). */
const config = (
  activityNames: string[],
  transitionDuration = 350,
): DomainEvent[] => [
  makeEvent("Initialized", {
    transitionDuration,
    eventDate: enoughPastTime(),
  }),
  ...activityNames.map((activityName) =>
    makeEvent("ActivityRegistered", {
      activityName,
      eventDate: enoughPastTime(),
    }),
  ),
];

const snapshot = (events: NavigationEvent[]): StackSnapshot => ({
  $schema: "stackflow.snapshot.v1",
  events,
});

/** Escape hatch for structurally-malformed snapshots the type would reject. */
const rawSnapshot = (value: unknown): StackSnapshot => value as StackSnapshot;

const provideSnapshotPlugin = (
  snap: StackSnapshot,
  extra?: Partial<ReturnType<StackflowPlugin>>,
): StackflowPlugin => {
  return () => ({
    key: "provider",
    provideSnapshot: () => snap,
    ...extra,
  });
};

/** Run makeCoreStore with a single snapshot provider and return any throw. */
const catchLoad = (
  snap: StackSnapshot,
  initialEvents: DomainEvent[],
): unknown => {
  let caught: unknown;
  try {
    makeCoreStore({
      initialEvents,
      plugins: [provideSnapshotPlugin(snap)],
    });
  } catch (error) {
    caught = error;
  }
  return caught;
};

// ---------------------------------------------------------------------------
// happy path · L2 · L3
// ---------------------------------------------------------------------------

test("load - 유효한 스냅샷의 탐색 기록을 충실히 재구성합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
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
        ]),
      ),
    ],
  });

  const stack = actions.getStack();
  const a = stack.activities.find((x) => x.id === "a1");
  const b = stack.activities.find((x) => x.id === "b1");

  expect(a?.transitionState).toEqual("enter-done");
  expect(b?.transitionState).toEqual("enter-done");
  expect(b?.isTop).toBe(true);
  expect(b?.isActive).toBe(true);
  // z-order A→B observed via zIndex/isTop (activities are sorted by id, not
  // z-order — see aggregate post-processing).
  expect((a?.zIndex ?? 0) < (b?.zIndex ?? 0)).toBe(true);
  expect(stack.globalTransitionState).toEqual("idle");
});

test("load - step 이벤트를 담은 스냅샷의 steps·현재 위치·stepId를 충실히 재구성합니다", () => {
  // Dates follow the recorded order (a snapshot's dates are its replay
  // order): the push precedes the step it hosts.
  const originalPushDate = enoughPastTime();
  const originalStepDate = enoughPastTime();

  const { actions } = makeCoreStore({
    initialEvents: config(["A"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            id: "e1",
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: originalPushDate,
          }),
          makeEvent("StepPushed", {
            id: "e2",
            targetActivityId: "a1",
            stepId: "s2",
            stepParams: { step: "2" },
            eventDate: originalStepDate,
          }),
          makeEvent("StepPushed", {
            id: "e3",
            targetActivityId: "a1",
            stepId: "s3",
            stepParams: { step: "3" },
            eventDate: enoughPastTime(),
          }),
          makeEvent("StepReplaced", {
            id: "e4",
            targetActivityId: "a1",
            stepId: "s3b",
            stepParams: { step: "3b" },
            eventDate: enoughPastTime(),
          }),
          makeEvent("StepPopped", {
            id: "e5",
            targetActivityId: "a1",
            eventDate: enoughPastTime(),
          }),
        ]),
      ),
    ],
  });

  const a = actions.getStack().activities.find((x) => x.id === "a1");

  // Replaying StepPushed×2 → StepReplaced → StepPopped leaves steps [a1, s2].
  expect(a?.steps.map((s) => s.id)).toEqual(["a1", "s2"]);
  expect(a?.steps[0].enteredBy.id).toEqual("e1");
  expect(a?.steps[1].params.step).toEqual("2");
  expect(a?.steps[1].enteredBy.id).toEqual("e2");
  // Current position is the last remaining step.
  expect(a?.params.step).toEqual("2");
  // Snapshot events replay byte-for-byte — eventDate included.
  expect(a?.steps[1].enteredBy.eventDate).toEqual(originalStepDate);
  expect(a?.transitionState).toEqual("enter-done");
  expect(actions.getStack().globalTransitionState).toEqual("idle");
});

test("load - options의 초기 Pushed(initialActivity)를 폐기하고 스냅샷만을 탐색 기록으로 삼습니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: [
      ...config(["Home", "A"]),
      makeEvent("Pushed", {
        activityId: "home1",
        activityName: "Home",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
      ),
    ],
  });

  const ids = actions.getStack().activities.map((x) => x.id);
  expect(ids).toContain("a1");
  expect(ids).not.toContain("home1");
});

test("load - 현행 config에서 transitionDuration·등록집합을 재파생합니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: config(["A"], 350),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
      ),
    ],
  });

  const stack = actions.getStack();
  expect(stack.transitionDuration).toEqual(350);
  expect(stack.activities.some((x) => x.id === "a1")).toBe(true);
});

// ---------------------------------------------------------------------------
// load interception — the override chain runs on the replay sequence
// ---------------------------------------------------------------------------

test('load - overrideInitialEvents 체인이 스냅샷 재생열 전체와 initInfo { kind: "load" }로 호출됩니다', () => {
  const overrideInitialEvents = jest.fn(
    (args: {
      initialEvents: SnapshotEvent[];
      initialContext: any;
      initInfo: StackInitInfo;
    }) => args.initialEvents,
  );

  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            id: "e1",
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
          makeEvent("Pushed", {
            id: "e2",
            activityId: "b1",
            activityName: "B",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
          makeEvent("Popped", {
            id: "e3",
            eventDate: enoughPastTime(),
          }),
        ]),
        { overrideInitialEvents },
      ),
    ],
  });

  expect(overrideInitialEvents).toHaveBeenCalledTimes(1);
  const args = overrideInitialEvents.mock.calls[0][0];
  // The full replay sequence flows through — including events (Popped) that
  // are not initial-entry vocabulary — with original ids.
  expect(args.initialEvents.map((e) => ({ name: e.name, id: e.id }))).toEqual([
    { name: "Pushed", id: "e1" },
    { name: "Pushed", id: "e2" },
    { name: "Popped", id: "e3" },
  ]);
  // The same one-shot record shape onInit receives.
  expect(args.initInfo).toEqual({ kind: "load" });
  // An identity return reconstructs the default faithful result: the Popped
  // still applies, so a1 is back on top.
  const top = actions.getStack().activities.find((x) => x.isTop);
  expect(top?.id).toEqual("a1");
});

test("load - 체인의 반환이 재생열로 채택됩니다 — 이벤트를 걸러내면 탐색 기록이 그에 맞게 재구성됩니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
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
          makeEvent("Popped", {
            eventDate: enoughPastTime(),
          }),
        ]),
        {
          overrideInitialEvents: ({ initialEvents }) =>
            initialEvents.filter((e) => e.name !== "Popped"),
        },
      ),
    ],
  });

  // With the Popped dropped from the replay sequence, b1 is alive and on top.
  const b = actions.getStack().activities.find((x) => x.id === "b1");
  expect(b?.transitionState).toEqual("enter-done");
  expect(b?.isTop).toBe(true);
});

test("load - 체인이 추가한 이벤트도 재기저 없이 그 date 그대로 재생됩니다(fresh date면 전환 진행 중으로 복원)", () => {
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "C"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
        {
          overrideInitialEvents: ({ initialEvents }) => [
            ...initialEvents,
            // Appended with a fresh (now) eventDate — the chain's return
            // replays as-is, so the fresh push restores mid-transition; a
            // plugin wanting a settled entry dates the event itself.
            makeEvent("Pushed", {
              activityId: "c1",
              activityName: "C",
              activityParams: {},
            }),
          ],
        },
      ),
    ],
  });

  const stack = actions.getStack();
  const c = stack.activities.find((x) => x.id === "c1");
  expect(c?.transitionState).toEqual("enter-active");
  expect(c?.isTop).toBe(true);
  expect(stack.globalTransitionState).toEqual("loading");
});

test("load - 낡은 스냅샷을 체인이 수선하면 검증은 수선된 재생열에 적용되어 load가 성공합니다", () => {
  // The snapshot materializes unregistered "B" — on its own this fails as
  // incompatible-events. A plugin that strips the dead activity's events
  // repairs the sequence: validation applies to what actually replays.
  const { actions } = makeCoreStore({
    initialEvents: config(["A"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
          makeEvent("Replaced", {
            activityId: "b1",
            activityName: "B",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
        {
          overrideInitialEvents: ({ initialEvents }) =>
            initialEvents.filter(
              (e) => !("activityName" in e && e.activityName === "B"),
            ),
        },
      ),
    ],
  });

  const a = actions.getStack().activities.find((x) => x.id === "a1");
  expect(a?.transitionState).toEqual("enter-done");
  expect(a?.isTop).toBe(true);
});

test("load - 체인 반환이 미등록 activity를 물화하면 incompatible-events로 실패합니다", () => {
  let caught: unknown;
  try {
    makeCoreStore({
      initialEvents: config(["A"]),
      plugins: [
        provideSnapshotPlugin(
          snapshot([
            makeEvent("Pushed", {
              activityId: "a1",
              activityName: "A",
              activityParams: {},
              eventDate: enoughPastTime(),
            }),
          ]),
          {
            overrideInitialEvents: ({ initialEvents }) => [
              ...initialEvents,
              makeEvent("Pushed", {
                activityId: "x1",
                activityName: "X",
                activityParams: {},
                eventDate: enoughPastTime(),
              }),
            ],
          },
        ),
      ],
    });
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(SnapshotLoadError);
  expect((caught as SnapshotLoadError).cause.kind).toEqual(
    "incompatible-events",
  );
});

test("load - 체인이 재생열을 비우면 empty-stack으로 실패하고 공급자의 onLoadError로 라우팅됩니다", () => {
  const onLoadError = jest.fn(
    (_args: { error: SnapshotLoadError; initialContext: any }) => ({
      recover: "create" as const,
    }),
  );

  const store = makeCoreStore({
    initialEvents: [
      ...config(["Home", "A"]),
      makeEvent("Pushed", {
        activityId: "home1",
        activityName: "Home",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
        { onLoadError },
      ),
      () => ({
        key: "emptier",
        // A load-only policy — the create run after recovery passes through.
        overrideInitialEvents: ({ initialEvents, initInfo }) =>
          initInfo.kind === "load" ? [] : initialEvents,
      }),
    ],
  });

  expect(onLoadError).toHaveBeenCalledTimes(1);
  expect(onLoadError.mock.calls[0][0].error.cause.kind).toEqual("empty-stack");
  // Recovery resumed the create path with the option's initial entry.
  expect(store.actions.getStack().activities.map((x) => x.id)).toEqual([
    "home1",
  ]);
});

test("load - 체인 훅이 throw하면 그 에러가 그대로 전파되고 onLoadError는 호출되지 않습니다", () => {
  // Characterization, not contract: a throwing hook is a plugin bug, not a
  // snapshot defect — it is not dressed up as a SnapshotLoadError nor routed
  // to the provider. Same rationale as the provideSnapshot/onLoadError throw
  // pins below.
  const hookFailure = new Error("override hook failed");
  const onLoadError = jest.fn();

  let caught: unknown;
  try {
    makeCoreStore({
      initialEvents: config(["A"]),
      plugins: [
        provideSnapshotPlugin(
          snapshot([
            makeEvent("Pushed", {
              activityId: "a1",
              activityName: "A",
              activityParams: {},
              eventDate: enoughPastTime(),
            }),
          ]),
          { onLoadError },
        ),
        () => ({
          key: "thrower",
          overrideInitialEvents: () => {
            throw hookFailure;
          },
        }),
      ],
    });
  } catch (error) {
    caught = error;
  }

  expect(caught).toBe(hookFailure);
  expect(onLoadError).toHaveBeenCalledTimes(0);
});

test("load - 초기 activity 핸들러를 호출하지 않습니다", () => {
  const onInitialActivityIgnored = jest.fn();
  const onInitialActivityNotFound = jest.fn();

  const { actions } = makeCoreStore({
    // No option-level initial Pushed: under the create path this would fire
    // onInitialActivityNotFound. The load path must skip that evaluation.
    initialEvents: config(["A"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
      ),
    ],
    handlers: {
      onInitialActivityIgnored,
      onInitialActivityNotFound,
    },
  });

  expect(onInitialActivityIgnored).toHaveBeenCalledTimes(0);
  expect(onInitialActivityNotFound).toHaveBeenCalledTimes(0);
  expect(actions.getStack().activities.some((x) => x.id === "a1")).toBe(true);
});

// ---------------------------------------------------------------------------
// §3.6 signal on load · §4.3 timing
// ---------------------------------------------------------------------------

test('load - onInit이 init()에서 정확히 1회 initInfo { kind: "load" }로 발화합니다', () => {
  const onInit = jest.fn();

  const store = makeCoreStore({
    initialEvents: config(["A"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
        { onInit },
      ),
    ],
  });

  // onInit does not fire during makeCoreStore — only on init().
  expect(onInit).toHaveBeenCalledTimes(0);

  store.init();

  expect(onInit).toHaveBeenCalledTimes(1);
  expect(onInit.mock.calls[0][0].initInfo).toEqual({ kind: "load" });
});

test("load - 재생 중 post-effect 훅(onPushed·onReplaced·onChanged)이 발화하지 않습니다", () => {
  const onPushed = jest.fn();
  const onReplaced = jest.fn();
  const onChanged = jest.fn();

  const store = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
          makeEvent("Replaced", {
            activityId: "b1",
            activityName: "B",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
        { onPushed, onReplaced, onChanged },
      ),
    ],
  });

  store.init();

  expect(onPushed).toHaveBeenCalledTimes(0);
  expect(onReplaced).toHaveBeenCalledTimes(0);
  expect(onChanged).toHaveBeenCalledTimes(0);
  // Non-vacuous: the snapshot was actually reconstructed.
  expect(store.actions.getStack().activities.some((x) => x.id === "b1")).toBe(
    true,
  );
});

test("load - makeCoreStore 반환 시점에 복원 스택이 동기적으로 구성돼 있습니다(과거 date 스냅샷은 정착 상태)", () => {
  const { actions } = makeCoreStore({
    initialEvents: config(["A"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
      ),
    ],
  });

  // Observed synchronously right after the call returns — no microtask/timer.
  const stack = actions.getStack();
  expect(stack.activities.some((x) => x.id === "a1")).toBe(true);
  expect(stack.globalTransitionState).toEqual("idle");
});

// ---------------------------------------------------------------------------
// structure check → unrecognized-snapshot
// ---------------------------------------------------------------------------

test("load - $schema 불일치 스냅샷은 SnapshotLoadError{unrecognized-snapshot}로 실패합니다", () => {
  const caught = catchLoad(
    rawSnapshot({
      $schema: "stackflow.snapshot.v2",
      events: [
        makeEvent("Pushed", {
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: enoughPastTime(),
        }),
      ],
    }),
    config(["A"]),
  );

  expect(caught).toBeInstanceOf(SnapshotLoadError);
  expect((caught as SnapshotLoadError).cause).toEqual({
    kind: "unrecognized-snapshot",
    detail: "$schema mismatch",
  });
});

test("load - events가 배열이 아닌 스냅샷은 unrecognized-snapshot로 실패합니다", () => {
  const caught = catchLoad(
    rawSnapshot({ $schema: "stackflow.snapshot.v1", events: "nope" }),
    config(["A"]),
  );

  expect(caught).toBeInstanceOf(SnapshotLoadError);
  expect((caught as SnapshotLoadError).cause).toEqual({
    kind: "unrecognized-snapshot",
    detail: "events is not an array",
  });
});

test("load - events에 스냅샷이 나를 수 없는 항목(static event)이 있으면 unrecognized-snapshot로 실패합니다", () => {
  const caught = catchLoad(
    rawSnapshot({
      $schema: "stackflow.snapshot.v1",
      events: [
        makeEvent("Pushed", {
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: enoughPastTime(),
        }),
        // A static event embedded in the snapshot. Statics are re-derived from
        // the current config at load time — without a structure check this
        // would be silently registered and the load would succeed.
        makeEvent("ActivityRegistered", {
          activityName: "B",
          eventDate: enoughPastTime(),
        }),
      ],
    }),
    config(["A"]),
  );

  expect(caught).toBeInstanceOf(SnapshotLoadError);
  // The offending item's position is named for diagnosis (the valid Pushed at
  // index 0 passes; the static item sits at index 1).
  expect((caught as SnapshotLoadError).cause).toEqual({
    kind: "unrecognized-snapshot",
    detail: "event item at index 1 is not a snapshot event",
  });
});

test("load - events 항목에 id가 결손되면 unrecognized-snapshot로 실패합니다", () => {
  const caught = catchLoad(
    rawSnapshot({
      $schema: "stackflow.snapshot.v1",
      events: [
        {
          name: "Pushed",
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: enoughPastTime(),
        },
      ],
    }),
    config(["A"]),
  );

  expect(caught).toBeInstanceOf(SnapshotLoadError);
  expect((caught as SnapshotLoadError).cause).toEqual({
    kind: "unrecognized-snapshot",
    detail: "event item at index 0 is not a snapshot event",
  });
});

test("load - events 항목에 name이 결손되면 unrecognized-snapshot로 실패합니다", () => {
  const caught = catchLoad(
    rawSnapshot({
      $schema: "stackflow.snapshot.v1",
      events: [
        {
          id: "e1",
          activityId: "a1",
          activityName: "A",
          activityParams: {},
          eventDate: enoughPastTime(),
        },
      ],
    }),
    config(["A"]),
  );

  expect(caught).toBeInstanceOf(SnapshotLoadError);
  expect((caught as SnapshotLoadError).cause).toEqual({
    kind: "unrecognized-snapshot",
    detail: "event item at index 0 is not a snapshot event",
  });
});

// ---------------------------------------------------------------------------
// registration check → incompatible-events · L6
// ---------------------------------------------------------------------------

test("load - 미등록 activity를 물화하는 Pushed는 SnapshotLoadError{incompatible-events}로 실패합니다", () => {
  const caught = catchLoad(
    snapshot([
      makeEvent("Pushed", {
        activityId: "b1",
        activityName: "B",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ]),
    config(["A"]),
  );

  expect(caught).toBeInstanceOf(SnapshotLoadError);
  const cause = (caught as SnapshotLoadError).cause;
  expect(cause.kind).toEqual("incompatible-events");
  if (cause.kind === "incompatible-events") {
    expect(cause.detail).toBeDefined();
  }
});

test("load - 미등록 activity를 물화하는 Replaced는 SnapshotLoadError{incompatible-events}로 실패합니다", () => {
  const caught = catchLoad(
    snapshot([
      makeEvent("Pushed", {
        activityId: "a1",
        activityName: "A",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
      makeEvent("Replaced", {
        activityId: "b1",
        activityName: "B",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ]),
    config(["A"]),
  );

  expect(caught).toBeInstanceOf(SnapshotLoadError);
  expect((caught as SnapshotLoadError).cause.kind).toEqual("incompatible-events");
});

test("load - 등록된 activity를 물화하는 Replaced는 정상 load됩니다", () => {
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
          makeEvent("Replaced", {
            activityId: "b1",
            activityName: "B",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
      ),
    ],
  });

  const stack = actions.getStack();
  const b = stack.activities.find((x) => x.id === "b1");
  const a = stack.activities.find((x) => x.id === "a1");

  expect(b?.isTop).toBe(true);
  expect(b?.transitionState).toEqual("enter-done");
  expect(a?.transitionState).toEqual("exit-done");
});

// ---------------------------------------------------------------------------
// postcondition → empty-stack · L3
// ---------------------------------------------------------------------------

test("load - events가 빈 스냅샷은 SnapshotLoadError{empty-stack}로 실패합니다", () => {
  const caught = catchLoad(snapshot([]), config(["A"]));

  expect(caught).toBeInstanceOf(SnapshotLoadError);
  expect((caught as SnapshotLoadError).cause.kind).toEqual("empty-stack");
});

test("load - 재생 후 enter 상태 activity가 0개인 스냅샷은 empty-stack으로 실패합니다", () => {
  // A pop with no activity to pop replays to zero activities: non-empty events
  // but zero enter-state activities. (Core cannot pop the root, so a
  // Pushed→Popped sequence never reaches zero — a pops-only history does.)
  const caught = catchLoad(
    snapshot([
      makeEvent("Popped", {
        eventDate: enoughPastTime(),
      }),
    ]),
    config(["A"]),
  );

  expect(caught).toBeInstanceOf(SnapshotLoadError);
  expect((caught as SnapshotLoadError).cause.kind).toEqual("empty-stack");
});

// ---------------------------------------------------------------------------
// consumer-transformed snapshot boundaries — accepted edges, pinned
// ---------------------------------------------------------------------------

test("load - 중복 id 스냅샷은 거부되지 않고 마지막 출현이 이깁니다(last-wins)", () => {
  // Duplicate event ids can only come from a consumer-transformed snapshot
  // (capture dedupes). They are an accepted boundary, not a rejection case,
  // and dedup keeps the LAST occurrence — pinned so the direction doesn't
  // silently flip.
  const { actions } = makeCoreStore({
    initialEvents: config(["A", "B"]),
    plugins: [
      provideSnapshotPlugin(
        snapshot([
          makeEvent("Pushed", {
            id: "dup",
            activityId: "a1",
            activityName: "A",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
          makeEvent("Pushed", {
            id: "dup",
            activityId: "b1",
            activityName: "B",
            activityParams: {},
            eventDate: enoughPastTime(),
          }),
        ]),
      ),
    ],
  });

  // The later entry survived; the earlier one was dropped.
  const ids = actions.getStack().activities.map((x) => x.id);
  expect(ids).toEqual(["b1"]);
  expect(actions.getStack().activities[0].transitionState).toEqual(
    "enter-done",
  );
});

test("load - 스냅샷과 이벤트 항목의 미지 프로퍼티를 수용합니다(전방 호환)", () => {
  // A snapshot written by a newer version may carry fields this version does
  // not know. The structure check validates what it needs and tolerates the
  // rest — pinned so the tolerance isn't tightened by accident.
  const { actions } = makeCoreStore({
    initialEvents: config(["A"]),
    plugins: [
      provideSnapshotPlugin(
        rawSnapshot({
          $schema: "stackflow.snapshot.v1",
          futureField: { anything: true },
          events: [
            {
              ...makeEvent("Pushed", {
                activityId: "a1",
                activityName: "A",
                activityParams: {},
                eventDate: enoughPastTime(),
              }),
              futureEventField: "tolerated",
            },
          ],
        }),
      ),
    ],
  });

  const a = actions.getStack().activities.find((x) => x.id === "a1");
  expect(a?.transitionState).toEqual("enter-done");
});

// ---------------------------------------------------------------------------
// onLoadError routing
// ---------------------------------------------------------------------------

test('load - 실패 시 onLoadError가 {recover:"create"}를 반환하면 throw 없이 create 경로로 재개합니다', () => {
  const onInit = jest.fn();
  const onLoadError = jest.fn(() => ({ recover: "create" as const }));

  const store = makeCoreStore({
    initialEvents: [
      ...config(["Home"]),
      makeEvent("Pushed", {
        activityId: "home1",
        activityName: "Home",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      provideSnapshotPlugin(
        rawSnapshot({ $schema: "stackflow.snapshot.v2", events: [] }),
        { onLoadError, onInit },
      ),
    ],
  });

  store.init();

  // Recovery was actually triggered, then resumed cleanly on the create path.
  expect(onLoadError).toHaveBeenCalledTimes(1);
  expect(store.actions.getStack().activities.map((x) => x.id)).toEqual([
    "home1",
  ]);
  expect(onInit.mock.calls[0][0].initInfo).toEqual({ kind: "create" });
});

test('load - recover:"create" 재개가 overrideInitialEvents 체인과 initial-activity 핸들러를 포함한 create 파이프라인을 온전히 태웁니다', () => {
  const onInit = jest.fn();
  const onInitialActivityIgnored = jest.fn();
  const overrideInitialEvents = jest.fn(
    (_args: {
      initialEvents: SnapshotEvent[];
      initialContext: any;
      initInfo: StackInitInfo;
    }) => [
      makeEvent("Pushed", {
        activityId: "redirect1",
        activityName: "Redirect",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
  );

  const store = makeCoreStore({
    initialEvents: [
      ...config(["Home", "Redirect"]),
      makeEvent("Pushed", {
        activityId: "home1",
        activityName: "Home",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      provideSnapshotPlugin(
        rawSnapshot({ $schema: "stackflow.snapshot.v2", events: [] }),
        { onLoadError: () => ({ recover: "create" as const }), onInit },
      ),
      () => ({ key: "redirector", overrideInitialEvents }),
    ],
    handlers: { onInitialActivityIgnored },
  });
  store.init();

  // The chain ran, over the option's initial events (not snapshot leftovers).
  // It ran only once: the load attempt failed at the structure check, before
  // the chain — so this single call is the recovery's create run.
  expect(overrideInitialEvents).toHaveBeenCalledTimes(1);
  expect(overrideInitialEvents.mock.calls[0][0].initialEvents).toMatchObject([
    { name: "Pushed", activityId: "home1" },
  ]);
  expect(overrideInitialEvents.mock.calls[0][0].initInfo).toEqual({
    kind: "create",
  });
  // The chain's substitution is what the stack is built from...
  expect(store.actions.getStack().activities.map((x) => x.id)).toEqual([
    "redirect1",
  ]);
  // ...and the initial-activity handler judged that substitution, as on any
  // create.
  expect(onInitialActivityIgnored).toHaveBeenCalledTimes(1);
  expect(onInitialActivityIgnored.mock.calls[0][0]).toMatchObject([
    { name: "Pushed", activityId: "redirect1" },
  ]);
  expect(onInit.mock.calls[0][0].initInfo).toEqual({ kind: "create" });
});

test("load - recover:create 재개 시 provideSnapshot을 재폴링하지 않습니다", () => {
  const provideSnapshot = jest.fn(() =>
    rawSnapshot({ $schema: "stackflow.snapshot.v2", events: [] }),
  );

  const { actions } = makeCoreStore({
    initialEvents: [
      ...config(["Home"]),
      makeEvent("Pushed", {
        activityId: "home1",
        activityName: "Home",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      () => ({
        key: "provider",
        provideSnapshot,
        onLoadError: () => ({ recover: "create" as const }),
      }),
    ],
  });

  // Polled exactly once — recovery does not re-poll.
  expect(provideSnapshot).toHaveBeenCalledTimes(1);
  expect(actions.getStack().activities.map((x) => x.id)).toEqual(["home1"]);
});

test("load - onLoadError가 void를 반환하면 SnapshotLoadError를 makeCoreStore 밖으로 던집니다", () => {
  let caught: unknown;
  try {
    makeCoreStore({
      initialEvents: config(["A"]),
      plugins: [
        provideSnapshotPlugin(
          rawSnapshot({ $schema: "stackflow.snapshot.v2", events: [] }),
          { onLoadError: () => undefined },
        ),
      ],
    });
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(SnapshotLoadError);
});

test('load - onLoadError가 {recover:"create"} 아닌 truthy 값을 반환하면 SnapshotLoadError를 그대로 던집니다', () => {
  // Recovery takes the exact { recover: "create" } decision. A JS consumer
  // returning some other truthy shape must not be mistaken for it — pinned so
  // the check never loosens into truthiness.
  let caught: unknown;
  try {
    makeCoreStore({
      initialEvents: config(["A"]),
      plugins: [
        provideSnapshotPlugin(
          rawSnapshot({ $schema: "stackflow.snapshot.v2", events: [] }),
          {
            onLoadError: () =>
              ({ recover: "retry" }) as unknown as { recover: "create" },
          },
        ),
      ],
    });
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(SnapshotLoadError);
});

test("load - onLoadError 핸들러가 없으면 SnapshotLoadError를 makeCoreStore 밖으로 던집니다", () => {
  const caught = catchLoad(
    rawSnapshot({ $schema: "stackflow.snapshot.v2", events: [] }),
    config(["A"]),
  );

  expect(caught).toBeInstanceOf(SnapshotLoadError);
});

test("load - onLoadError는 스냅샷을 공급한 플러그인에게만 호출됩니다", () => {
  const supplierOnLoadError = jest.fn(() => ({ recover: "create" as const }));
  const bystanderOnLoadError = jest.fn();

  makeCoreStore({
    initialEvents: [
      ...config(["Home"]),
      makeEvent("Pushed", {
        activityId: "home1",
        activityName: "Home",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    plugins: [
      provideSnapshotPlugin(
        rawSnapshot({ $schema: "stackflow.snapshot.v2", events: [] }),
        { key: "supplier", onLoadError: supplierOnLoadError },
      ),
      () => ({
        key: "bystander",
        provideSnapshot: () => null,
        onLoadError: bystanderOnLoadError,
      }),
    ],
  });

  expect(supplierOnLoadError).toHaveBeenCalledTimes(1);
  expect(bystanderOnLoadError).toHaveBeenCalledTimes(0);
});

test("load - provideSnapshot·onLoadError는 생성 시 options.initialContext를 인자로 전달받습니다", () => {
  const provideSnapshot = jest.fn(() =>
    rawSnapshot({ $schema: "stackflow.snapshot.v2", events: [] }),
  );
  const onLoadError = jest.fn(() => ({ recover: "create" as const }));

  makeCoreStore({
    initialEvents: [
      ...config(["Home"]),
      makeEvent("Pushed", {
        activityId: "home1",
        activityName: "Home",
        activityParams: {},
        eventDate: enoughPastTime(),
      }),
    ],
    initialContext: { foo: "bar" },
    plugins: [
      () => ({
        key: "provider",
        provideSnapshot,
        onLoadError,
      }),
    ],
  });

  expect(provideSnapshot).toHaveBeenCalledWith({
    initialContext: { foo: "bar" },
  });
  expect(onLoadError).toHaveBeenCalledWith(
    expect.objectContaining({ initialContext: { foo: "bar" } }),
  );
});

// ---------------------------------------------------------------------------
// hook-thrown errors — characterization (undefined behavior, pinned)
// ---------------------------------------------------------------------------

test("load - provideSnapshot이 throw하면 에러가 makeCoreStore 밖으로 그대로 전파되고 onLoadError는 호출되지 않습니다", () => {
  // Characterization, not contract: a throwing hook is undefined behavior.
  // Pinned so that changing today's raw propagation (e.g. routing provider
  // failures into onLoadError) is a conscious contract decision, not a slip.
  const decodeFailure = new SyntaxError("Unexpected end of JSON input");
  const onLoadError = jest.fn();

  let caught: unknown;
  try {
    makeCoreStore({
      initialEvents: config(["A"]),
      plugins: [
        () => ({
          key: "provider",
          provideSnapshot: () => {
            throw decodeFailure;
          },
          onLoadError,
        }),
      ],
    });
  } catch (error) {
    caught = error;
  }

  expect(caught).toBe(decodeFailure);
  expect(onLoadError).toHaveBeenCalledTimes(0);
});

test("load - onLoadError가 throw하면 그 에러가 SnapshotLoadError 대신 makeCoreStore 밖으로 그대로 전파됩니다", () => {
  // Characterization, not contract — same rationale as above.
  const handlerFailure = new Error("storage cleanup failed");

  let caught: unknown;
  try {
    makeCoreStore({
      initialEvents: config(["A"]),
      plugins: [
        provideSnapshotPlugin(
          rawSnapshot({ $schema: "stackflow.snapshot.v2", events: [] }),
          {
            onLoadError: () => {
              throw handlerFailure;
            },
          },
        ),
      ],
    });
  } catch (error) {
    caught = error;
  }

  expect(caught).toBe(handlerFailure);
});

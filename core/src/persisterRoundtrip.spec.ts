import type { DomainEvent } from "./event-types";
import { makeEvent } from "./event-utils";
import type { StackflowPlugin } from "./interfaces";
import { makeCoreStore } from "./makeCoreStore";
import type { StackSnapshot } from "./StackSnapshot";

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

const initialHome = () =>
  makeEvent("Pushed", {
    activityId: "home1",
    activityName: "Home",
    activityParams: {},
    eventDate: enoughPastTime(),
  });

/**
 * The reference decode shape for persister authors. Decoding happens inside
 * `provideSnapshot`, so a stored value that cannot even be decoded never
 * reaches core — the codec is the supplier's responsibility (R13) and decode
 * failures are outside core's `onLoadError` contract. Self-handle them:
 * discard the stored value and return null, falling back to the create path.
 */
const decodeOrDiscard = (memory: {
  value: string | null;
}): StackSnapshot | null => {
  if (!memory.value) {
    return null;
  }
  try {
    return JSON.parse(memory.value) as StackSnapshot;
  } catch {
    memory.value = null;
    return null;
  }
};

test("persister 왕복 - 캡처(onChanged)→JSON 보존→다음 생성의 provideSnapshot load가 core API만으로 닫힙니다", () => {
  // A persister mimic: capture on change, JSON codec, in-memory storage.
  const memory: { value: string | null } = { value: null };

  const persister = (
    onInit: ReturnType<StackflowPlugin>["onInit"],
  ): StackflowPlugin => {
    return () => ({
      key: "persister",
      onChanged({ actions }) {
        memory.value = JSON.stringify(actions.captureSnapshot());
      },
      provideSnapshot: () => decodeOrDiscard(memory),
      onInit,
    });
  };

  // Session 1: create Home, then navigate to Article (each change persists).
  const session1 = makeCoreStore({
    initialEvents: [...config(["Home", "Article"]), initialHome()],
    plugins: [persister(() => {})],
  });
  session1.actions.push({
    activityId: "article1",
    activityName: "Article",
    activityParams: {},
  });

  // Session 2: same config + plugin; storage now holds the snapshot.
  const onInit2 = jest.fn();
  const session2 = makeCoreStore({
    initialEvents: [...config(["Home", "Article"]), initialHome()],
    plugins: [persister(onInit2)],
  });
  session2.init();

  const stack = session2.actions.getStack();
  const home = stack.activities.find((x) => x.id === "home1");
  const article = stack.activities.find((x) => x.id === "article1");

  expect(home?.name).toEqual("Home");
  expect(home?.transitionState).toEqual("enter-done");
  expect(article?.name).toEqual("Article");
  // The article was pushed (and captured) moments ago, so its as-is replay
  // is still mid-transition — the restored stack picks up exactly where the
  // captured one left off and settles on its own clock.
  expect(article?.transitionState).toEqual("enter-active");
  expect(article?.isTop).toBe(true);
  expect((home?.zIndex ?? -1) < (article?.zIndex ?? -1)).toBe(true);
  expect(onInit2.mock.calls[0][0].initInfo).toEqual({ kind: "load" });
});

test("persister 왕복 - 손상 스냅샷을 onLoadError가 폐기하고 policy:recover로 초기 화면 기동합니다", () => {
  // Storage already holds a corrupt snapshot (wrong $schema).
  const memory: { value: string | null } = {
    value: JSON.stringify({ $schema: "stackflow.snapshot.v2", events: [] }),
  };

  const onInit = jest.fn();
  const persister: StackflowPlugin = () => ({
    key: "persister",
    provideSnapshot: () => decodeOrDiscard(memory),
    onLoadError: () => {
      memory.value = null;
      return { policy: "recover" as const };
    },
    onInit,
  });

  let threw = false;
  let store: ReturnType<typeof makeCoreStore> | undefined;
  try {
    store = makeCoreStore({
      initialEvents: [...config(["Home"]), initialHome()],
      plugins: [persister],
    });
    store.init();
  } catch {
    threw = true;
  }

  expect(threw).toBe(false);
  expect(store?.actions.getStack().activities.map((x) => x.id)).toEqual([
    "home1",
  ]);
  // The corrupt snapshot was discarded by the supplier.
  expect(memory.value).toBeNull();
  expect(onInit.mock.calls[0][0].initInfo).toEqual({ kind: "create" });
});

test("persister 왕복 - 디코드 불가한 보존물(잘린 write)은 공급자가 스스로 폐기하고 create로 기동합니다", () => {
  // Storage holds a truncated write (quota eviction, interrupted write) —
  // undecodable, so core never sees a snapshot and onLoadError has nothing
  // to route. The supplier's decode shape must absorb this itself.
  const memory: { value: string | null } = {
    value: '{"$schema":"stackflow.snapshot.v1","ev',
  };

  const onInit = jest.fn();
  const persister: StackflowPlugin = () => ({
    key: "persister",
    provideSnapshot: () => decodeOrDiscard(memory),
    onInit,
  });

  const store = makeCoreStore({
    initialEvents: [...config(["Home"]), initialHome()],
    plugins: [persister],
  });
  store.init();

  expect(store.actions.getStack().activities.map((x) => x.id)).toEqual([
    "home1",
  ]);
  // The undecodable stored value was discarded by the supplier.
  expect(memory.value).toBeNull();
  expect(onInit.mock.calls[0][0].initInfo).toEqual({ kind: "create" });
});

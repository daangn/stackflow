import {
  type CoreStore,
  makeCoreStore,
  makeEvent,
  type SnapshotEvent,
  type StackflowPlugin,
  type StackSnapshot,
} from "@stackflow/core";
import { activityGuardPlugin } from "./index";

export const ACTIVITY_NAMES = [
  "Home",
  "Article",
  "ArticleEdit",
  "Login",
  "Forbidden",
  "Audit",
] as const;

export type ActivityName = (typeof ACTIVITY_NAMES)[number];

let eventSequence = 0;
let activitySequence = 0;

export function resetDeterministicEvents() {
  eventSequence = 0;
  activitySequence = 0;
}

function nextActivityId() {
  activitySequence += 1;
  return `activity-${String(activitySequence).padStart(4, "0")}`;
}

export function event<Name extends Parameters<typeof makeEvent>[0]>(
  name: Name,
  params: Omit<Parameters<typeof makeEvent<Name>>[1], "id" | "eventDate"> & {
    id?: string;
    eventDate?: number;
  },
) {
  eventSequence += 1;
  return makeEvent(name, {
    id: `event-${eventSequence}`,
    eventDate: 1_000 + eventSequence,
    ...params,
  } as Parameters<typeof makeEvent<Name>>[1]);
}

export function pushed(
  activityName: ActivityName,
  activityParams: Record<string, string> = {},
  options: {
    activityId?: string;
    skipEnterActiveState?: boolean;
  } = {},
) {
  const generatedActivityId = nextActivityId();
  return event("Pushed", {
    activityId: options.activityId ?? generatedActivityId,
    activityName,
    activityParams,
    skipEnterActiveState: options.skipEnterActiveState ?? true,
  });
}

export function stepPushed(
  stepId: string,
  stepParams: Record<string, string>,
  targetActivityId: string,
) {
  return event("StepPushed", {
    stepId,
    stepParams,
    targetActivityId,
  });
}

export function staticEvents() {
  return [
    event("Initialized", { transitionDuration: 0 }),
    ...ACTIVITY_NAMES.map((activityName) =>
      event("ActivityRegistered", { activityName }),
    ),
  ];
}

export type GuardMap = Parameters<typeof activityGuardPlugin>[0]["guards"];

export function createStore({
  guards = {},
  initialEvents = [pushed("Home")],
  pluginsBefore = [],
  pluginsAfter = [],
  initialContext,
}: {
  guards?: GuardMap;
  initialEvents?: SnapshotEvent[];
  pluginsBefore?: StackflowPlugin[];
  pluginsAfter?: StackflowPlugin[];
  initialContext?: unknown;
} = {}): CoreStore {
  return makeCoreStore({
    initialEvents: [...staticEvents(), ...initialEvents],
    initialContext,
    plugins: [
      ...pluginsBefore,
      activityGuardPlugin({ guards }),
      ...pluginsAfter,
    ],
  });
}

export function snapshotProvider(snapshot: StackSnapshot): StackflowPlugin {
  return () => ({
    key: "test-snapshot-provider",
    provideSnapshot: () => snapshot,
  });
}

export function activityNames(store: CoreStore) {
  return store.actions.getStack().activities.map((activity) => activity.name);
}

export function topActivity(store: CoreStore) {
  return store.actions.getStack().activities.find((activity) => activity.isTop);
}

export function snapshotActivityNames(store: CoreStore) {
  return store.actions
    .captureSnapshot()
    .events.flatMap((snapshotEvent) =>
      snapshotEvent.name === "Pushed" || snapshotEvent.name === "Replaced"
        ? [snapshotEvent.activityName]
        : [],
    );
}

export function snapshotEventSummary(store: CoreStore) {
  return store.actions.captureSnapshot().events.map((snapshotEvent) => ({
    id: snapshotEvent.id,
    name: snapshotEvent.name,
    activityName:
      snapshotEvent.name === "Pushed" || snapshotEvent.name === "Replaced"
        ? snapshotEvent.activityName
        : undefined,
  }));
}

export function push(
  store: CoreStore,
  activityName: ActivityName,
  activityParams: Record<string, string> = {},
  options: { skipEnterActiveState?: boolean } = {},
) {
  store.actions.push({
    activityId: nextActivityId(),
    activityName,
    activityParams,
    skipEnterActiveState: options.skipEnterActiveState ?? true,
  });
}

export function replace(
  store: CoreStore,
  activityName: ActivityName,
  activityParams: Record<string, string> = {},
  options: { skipEnterActiveState?: boolean } = {},
) {
  store.actions.replace({
    activityId: nextActivityId(),
    activityName,
    activityParams,
    skipEnterActiveState: options.skipEnterActiveState ?? true,
  });
}

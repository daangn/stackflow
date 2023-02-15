import type { Activity, ActivityStep } from "@stackflow/core";
import type { History } from "history";

const STATE_TAG = `${process.env.PACKAGE_NAME}@${process.env.PACKAGE_VERSION}`;

interface State {
  activity: Activity;
  step?: ActivityStep;
}

interface SerializedState extends State {
  _TAG: typeof STATE_TAG;
}

function serializeStep(step: ActivityStep): ActivityStep {
  return {
    ...step,
    enteredBy:
      "activityContext" in step.enteredBy
        ? {
            ...step.enteredBy,
            activityContext: undefined,
          }
        : {
            ...step.enteredBy,
          },
  };
}

function serializeActivity(activity: Activity): Activity {
  return {
    ...activity,
    context: undefined,
    enteredBy: {
      ...activity.enteredBy,
      activityContext: undefined,
    },
    steps: activity.steps.map(serializeStep),
  };
}

function serializeState(state: State): SerializedState {
  return {
    _TAG: STATE_TAG,
    activity: serializeActivity(state.activity),
    step: state.step ? serializeStep(state.step) : undefined,
  };
}

export function safeParseState(state: unknown): State | null {
  const _state: any = state;

  if (
    typeof _state === "object" &&
    _state !== null &&
    "_TAG" in _state &&
    typeof _state._TAG === "string" &&
    _state._TAG === STATE_TAG
  ) {
    return state as State;
  }

  return null;
}

export function getCurrentState({ history }: { history: History }): unknown {
  return history.location.state;
}

export function pushState({
  history,
  pathname,
  state,
  useHash,
}: {
  history: History;
  pathname: string;
  state: State;
  useHash?: boolean;
}) {
  const nextPathname = useHash
    ? `${history.location.pathname}#${pathname}`
    : pathname;

  history.push(nextPathname, serializeState(state));
}

export function replaceState({
  history,
  pathname,
  state,
  useHash,
}: {
  history: History;
  pathname: string;
  state: State;
  useHash?: boolean;
}) {
  const nextPathname = useHash
    ? `${history.location.pathname}#${pathname}`
    : pathname;

  history.replace(nextPathname, serializeState(state));
}

import type { Activity, ActivityStep } from "@stackflow/core";
import type { History } from "history";

const STATE_TAG = "@stackflow/plugin-history-sync";

interface State {
  activity: Activity;
  step?: ActivityStep;
}

interface SerializedState extends State {
  _TAG: typeof STATE_TAG;
}

function clone<T>(input: T): T {
  return JSON.parse(JSON.stringify(input));
}

function serializeStep(step: ActivityStep): ActivityStep {
  return clone(step);
}

function serializeActivity(activity: Activity): Activity {
  return clone(activity);
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

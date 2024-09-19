import type { Activity, ActivityStep } from "@stackflow/core";
import { parse, stringify } from "flatted";
import type { History } from "history";

const STATE_TAG = "@stackflow/plugin-history-sync";

interface State {
  activity: Activity;
  step?: ActivityStep;
}

interface SerializedState {
  _TAG: typeof STATE_TAG;
  encoded: string;
}

function serializeState(state: State): SerializedState {
  return {
    _TAG: STATE_TAG,
    encoded: stringify({
      activity: state.activity,
      step: state.step,
    }),
  };
}

export function safeParseState(state: unknown): State | null {
  if (
    typeof state === "object" &&
    state !== null &&
    "_TAG" in state &&
    "encoded" in state &&
    typeof state._TAG === "string" &&
    state._TAG === STATE_TAG &&
    typeof state.encoded === "string"
  ) {
    return parse(state.encoded);
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

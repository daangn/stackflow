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
  flattedState: string;
}

function serializeState(state: State): SerializedState {
  return {
    _TAG: STATE_TAG,
    flattedState: stringify({
      activity: state.activity,
      step: state.step,
    }),
  };
}

function isSerializedState(input: unknown): input is SerializedState {
  return (
    typeof input === "object" &&
    input !== null &&
    "_TAG" in input &&
    "flattedState" in input &&
    typeof input._TAG === "string" &&
    input._TAG === STATE_TAG &&
    typeof input.flattedState === "string"
  );
}

export function parseState(input: unknown): State | null {
  try {
    return isSerializedState(input) ? parse(input.flattedState) : null;
  } catch {
    return null;
  }
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

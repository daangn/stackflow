import type { Activity, ActivityStep } from "@stackflow/core";
import { parse, stringify } from "flatted";
import type { History } from "history";

const STATE_TAG = "@stackflow/plugin-history-sync";

export interface State {
  activity: Activity;
  step?: ActivityStep;

  /**
   * Absolute position of this entry in the plugin's own coordinate system
   * (`0` = the entry that was current when the app first booted). Used by the
   * reconciler to identify self-induced `popstate` events and to compute
   * `history.go()` deltas. Absent in states serialized by older plugin
   * versions; those fall back to identity-based handling.
   */
  entryIndex?: number;
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
      entryIndex: state.entryIndex,
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

/**
 * The browser entry that represents an activity itself (its first step) is
 * serialized without a `step` field, so the step identity of a parsed state
 * falls back to the activity's first step. The core guarantees that an
 * activity's first step shares the activity's id (`makeActivityFromEvent`),
 * which keeps this identity stable even across re-pushes of the same
 * activity.
 */
export function getStateStepId(state: State): string {
  return state.step?.id ?? state.activity.steps?.[0]?.id ?? state.activity.id;
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

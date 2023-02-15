import type { Activity, ActivityStep } from "@stackflow/core";
import type { History } from "history";

import { isServer } from "./utils";

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

export function parseState(state: unknown): State | null {
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
  if (isServer()) {
    return null;
  }

  return history.location.state;
}

export function pushState({
  history,
  state,
  url,
  useHash,
}: {
  history: History;
  state: State;
  url: string;
  useHash?: boolean;
}) {
  if (isServer()) {
    return;
  }
  const nextUrl = useHash ? `${history.location.pathname}#${url}` : url;
  history.push(nextUrl, serializeState(state));
}

export function replaceState({
  history,
  url,
  state,
  useHash,
}: {
  history: History;
  url: string;
  state: State;
  useHash?: boolean;
}) {
  if (isServer()) {
    return;
  }
  const nextUrl = useHash ? `${history.location.pathname}#${url}` : url;
  history.replace(nextUrl, serializeState(state));
}

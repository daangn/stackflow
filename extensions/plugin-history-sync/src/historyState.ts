import type { Activity, ActivityStep } from "@stackflow/core";

import { isServer } from "./utils";

const STATE_TAG = `${process.env.NANOBUNDLE_PACKAGE_NAME}@${process.env.NANOBUNDLE_PACKAGE_VERSION}`;

interface State {
  activity: Activity;
  step?: ActivityStep;
}
interface SerializedState extends State {
  _TAG: typeof STATE_TAG;
}

export function getCurrentState(): unknown {
  if (isServer()) {
    return null;
  }

  return window.history.state;
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

export function pushState({
  state,
  url,
  useHash,
}: {
  state: State;
  url: string;
  useHash?: boolean;
}) {
  if (isServer()) {
    return;
  }
  const nextUrl = useHash ? `${window.location.pathname}#${url}` : url;
  window.history.pushState(serializeState(state), "", nextUrl);
}

export function replaceState({
  url,
  state,
  useHash,
}: {
  url: string;
  state: State;
  useHash?: boolean;
}) {
  if (isServer()) {
    return;
  }
  const nextUrl = useHash ? `${window.location.pathname}#${url}` : url;
  window.history.replaceState(serializeState(state), "", nextUrl);
}

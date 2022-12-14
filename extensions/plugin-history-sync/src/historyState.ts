import type { Activity, ActivityStep } from "@stackflow/core";

const STATE_TAG = `${process.env.PACKAGE_NAME}@${process.env.PACKAGE_VERSION}`;

const isServer = typeof window === "undefined";

interface State {
  activity: Activity;
  step?: ActivityStep;
}

export function getCurrentState(): unknown {
  if (isServer) {
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
  const _step = { ...step };

  if ("activityContext" in _step.pushedBy) {
    delete _step.pushedBy.activityContext;
  }

  return _step;
}

function serializeActivity(activity: Activity): Activity {
  const _activity = { ...activity };

  delete _activity.context;
  delete _activity.pushedBy.activityContext;
  _activity.steps = _activity.steps.map(serializeStep);

  return _activity;
}

function serializeState(state: State): State & { _TAG: string } {
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
  if (isServer) {
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
  if (isServer) {
    return;
  }
  const nextUrl = useHash ? `${window.location.pathname}#${url}` : url;
  window.history.replaceState(serializeState(state), "", nextUrl);
}

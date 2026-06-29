/**
 * The `window.__harness__` instrumentation bridge. It exposes only the public
 * stack snapshot, the browser location, and harness-owned observations
 * (blocker notifications, probe hook calls, the error sink, the fallback
 * count). It never reveals history-sync internals.
 */

import type {
  HarnessBridge,
  LocationView,
  StackActivityView,
  StackView,
} from "../shared/contract";
import { harnessStore } from "./harnessStore";
import { getCoreActions } from "./plugins/spyPlugin";

function serializeStack(): StackView {
  const actions = getCoreActions();
  if (!actions) {
    return { globalTransitionState: "loading", activities: [], active: null };
  }
  const stack = actions.getStack();
  const activities: StackActivityView[] = stack.activities
    .filter((a) => a.transitionState !== "exit-done")
    .map((a) => {
      const steps = a.steps ?? [];
      const topStep = steps[steps.length - 1];
      return {
        name: a.name,
        params: a.params,
        transitionState: a.transitionState,
        isActive: a.isActive,
        stepCount: steps.length,
        stepParams: topStep ? topStep.params : a.params,
      };
    });
  const active = activities.find((a) => a.isActive) ?? null;
  return {
    globalTransitionState: stack.globalTransitionState,
    activities,
    active,
  };
}

function readLocation(): LocationView {
  const { href, pathname, search, hash } = window.location;
  return { href, pathname, search, hash };
}

const bridge: HarnessBridge = {
  ready: false,
  getStack: serializeStack,
  getLocation: readLocation,
  getFallbackCallCount: () => harnessStore.fallbackCount,
  getBlockerLog: () => harnessStore.blockerLog.slice(),
  getProbeLog: () => harnessStore.probeLog.slice(),
  getErrors: () => harnessStore.errors.slice(),
};

export function installBridge() {
  window.__harness__ = bridge;
}

export function markReady() {
  bridge.ready = true;
}

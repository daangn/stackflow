/**
 * A small synthetic co-plugin used to exercise plugin-blocker's replay
 * interaction contract (the original suite's section 8). It is deliberately
 * NOT history-sync: it observes only its own onBeforePush calls, and on the
 * replay invocation (the 2nd call) it can run a nested navigation or cancel the
 * replay via preventDefault. The blocker's own log and the public
 * SCREEN/URL/STACK are the witnesses — history-sync's internal hooks are never
 * asserted.
 */

import type { StackflowReactPlugin } from "@stackflow/react";
import type { ProbeMode } from "../../shared/contract";
import { harnessStore } from "../harnessStore";

export function makeProbePlugin(mode: ProbeMode): StackflowReactPlugin {
  return () => ({
    key: "harness-probe",
    onBeforePush({ actions }) {
      const count = harnessStore.probeCall("onBeforePush");
      // The first call is the original attempt; the second is the replay that
      // plugin-blocker performs after every blocker has proceeded.
      if (count === 2) {
        if (mode === "nested") {
          actions.pop();
        } else if (mode === "prevent") {
          actions.preventDefault();
        }
      }
    },
  });
}

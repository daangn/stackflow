/**
 * Captures the core actions so the instrumentation bridge can read the public
 * stack snapshot. The React `stackflow()` output only surfaces push/replace/pop;
 * `getStack()` lives on the core actions handed to plugins via onInit.
 */

import type { StackflowActions } from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";

let captured: StackflowActions | null = null;

export const spyPlugin: StackflowReactPlugin = () => ({
  key: "harness-spy",
  onInit({ actions }) {
    captured = actions;
  },
});

export function getCoreActions(): StackflowActions | null {
  return captured;
}

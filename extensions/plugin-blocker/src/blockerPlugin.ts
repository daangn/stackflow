import type {
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";

export type NavigationEvent =
  | PushedEvent
  | PoppedEvent
  | ReplacedEvent
  | StepPushedEvent
  | StepPoppedEvent
  | StepReplacedEvent;

export type BlockedNavigation = {
  event: NavigationEvent;
};

export function blockerPlugin(): StackflowReactPlugin {
  return () => ({
    key: "@stackflow/plugin-blocker",
  });
}

export function useBlocker(options: {
  shouldBlock: (event: NavigationEvent) => boolean;
  onBlocked: (blockedNavigation: BlockedNavigation) => void;
}): {
  override: (fn: () => void) => void;
} {
  throw new Error("Not implemented");
}

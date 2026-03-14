import type {
  PoppedEvent,
  PushedEvent,
  ReplacedEvent,
  StepPoppedEvent,
  StepPushedEvent,
  StepReplacedEvent,
} from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";

export type NavigationAction =
  | Omit<PushedEvent, "id" | "eventDate">
  | Omit<PoppedEvent, "id" | "eventDate">
  | Omit<ReplacedEvent, "id" | "eventDate">
  | Omit<StepPushedEvent, "id" | "eventDate">
  | Omit<StepPoppedEvent, "id" | "eventDate">
  | Omit<StepReplacedEvent, "id" | "eventDate">;

export type BlockedNavigation = {
  event: NavigationAction;
};

export function blockerPlugin(): StackflowReactPlugin {
  return () => ({
    key: "@stackflow/plugin-blocker",
  });
}

export function useBlocker(options: {
  shouldBlock: (action: NavigationAction) => boolean;
  onBlocked: (
    blockedNavigation: BlockedNavigation,
    actions: { proceed: () => void },
  ) => void;
}): void {
  throw new Error("Not implemented");
}

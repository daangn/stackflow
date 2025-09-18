import type { PushedEvent, Stack, StepPushedEvent } from "@stackflow/core";

export interface NavigationProcess {
  captureNavigationOpportunity(
    stack: Stack | null,
    navigationTime: number,
  ): (PushedEvent | StepPushedEvent)[];

  getStatus(): NavigationProcessStatus;
}

export const NavigationProcessStatus = {
  IDLE: "idle",
  PROGRESS: "progress",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
} as const;

export type NavigationProcessStatus =
  (typeof NavigationProcessStatus)[keyof typeof NavigationProcessStatus];

export function isTerminated(status: NavigationProcessStatus): boolean {
  return (
    status === NavigationProcessStatus.SUCCEEDED ||
    status === NavigationProcessStatus.FAILED
  );
}

import type { Stack } from "@stackflow/core";

export interface ActivityActivationMonitor {
  captureActivitiesNavigation(stack: Stack): void;
  getActivationCount(): number;
  getTargetId(): string;
}

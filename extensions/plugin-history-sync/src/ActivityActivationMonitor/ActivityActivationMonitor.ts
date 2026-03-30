import type { Stack } from "@stackflow/core";

export interface ActivityActivationMonitor {
  captureStackChange(stack: Stack): void;
  getActivationCount(): number;
  getTargetId(): string;
}

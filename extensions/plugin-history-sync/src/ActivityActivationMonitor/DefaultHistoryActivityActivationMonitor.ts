import type { Stack } from "@stackflow/core";
import {
  type ActivityNavigationEvent,
  isActivityNavigationEvent,
} from "../NavigationEvent";
import {
  isTerminated,
  type NavigationProcess,
} from "../NavigationProcess/NavigationProcess";
import type { ActivityActivationMonitor } from "./ActivityActivationMonitor";

export class DefaultHistoryActivityActivationMonitor
  implements ActivityActivationMonitor
{
  private targetId: string;
  private initialSetupProcess: NavigationProcess;
  private focusCount: number;
  private previousActivationTrigger: ActivityNavigationEvent | null;

  constructor(targetId: string, initialSetupProcess: NavigationProcess) {
    this.targetId = targetId;
    this.initialSetupProcess = initialSetupProcess;
    this.focusCount = 0;
    this.previousActivationTrigger = null;
  }

  captureStackChange(stack: Stack): void {
    const navigationProcessStatus = this.initialSetupProcess.getStatus();

    if (!isTerminated(navigationProcessStatus)) return;

    const targetActivity = stack.activities.find(
      (activity) => activity.id === this.targetId,
    );

    if (!targetActivity || !targetActivity.isActive) return;

    const latestActivityNavigation = stack.events.findLast(
      isActivityNavigationEvent,
    );

    if (
      !latestActivityNavigation ||
      (this.previousActivationTrigger &&
        latestActivityNavigation.eventDate <=
          this.previousActivationTrigger.eventDate)
    )
      return;

    this.focusCount++;
    this.previousActivationTrigger = latestActivityNavigation;
  }

  getActivationCount(): number {
    return this.focusCount;
  }

  getTargetId(): string {
    return this.targetId;
  }
}

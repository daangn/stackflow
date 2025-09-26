import type { Stack } from "@stackflow/core";
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

  constructor(targetId: string, initialSetupProcess: NavigationProcess) {
    this.targetId = targetId;
    this.initialSetupProcess = initialSetupProcess;
    this.focusCount = 0;
  }

  captureActivitiesNavigation(stack: Stack): void {
    const navigationProcessStatus = this.initialSetupProcess.getStatus();

    if (!isTerminated(navigationProcessStatus)) return;

    const targetActivity = stack.activities.find(
      (activity) => activity.id === this.targetId,
    );

    if (!targetActivity || !targetActivity.isActive) return;

    this.focusCount++;
    console.log("focusCount", this.focusCount);
  }

  getActivationCount(): number {
    return this.focusCount;
  }

  getTargetId(): string {
    return this.targetId;
  }
}

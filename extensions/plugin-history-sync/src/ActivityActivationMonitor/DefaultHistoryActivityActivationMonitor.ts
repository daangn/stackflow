import {
  isTerminated,
  type NavigationProcess,
} from "NavigationProcess/NavigationProcess";
import type { Stack } from "@stackflow/core";
import type { ActivityActivationMonitor } from "./ActivityActivationMonitor";

export class DefaultHistoryActivityActivationMonitor
  implements ActivityActivationMonitor
{
  private targetId: string;
  private defaultHistorySetupProcess: NavigationProcess;
  private focusCount: number;

  constructor(targetId: string, defaultHistorySetupProcess: NavigationProcess) {
    this.targetId = targetId;
    this.defaultHistorySetupProcess = defaultHistorySetupProcess;
    this.focusCount = 0;
  }

  captureActivitiesNavigation(stack: Stack): void {
    const navigationProcessStatus = this.defaultHistorySetupProcess.getStatus();

    if (!isTerminated(navigationProcessStatus)) return;

    const targetActivity = stack.activities.find(
      (activity) => activity.id === this.targetId,
    );

    if (!targetActivity || !targetActivity.isActive) return;

    this.focusCount++;
  }

  getActivationCount(): number {
    return this.focusCount;
  }

  getTargetId(): string {
    return this.targetId;
  }
}

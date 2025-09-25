import type { Publisher } from "Publisher";
import type { Stack } from "@stackflow/core";
import type { ActivityActivationMonitor } from "./ActivityActivationMonitor";

export class CountPublishingActivityActivationMonitor
  implements ActivityActivationMonitor
{
  private activityActivationMonitor: ActivityActivationMonitor;
  private publisher: Publisher<number>;

  constructor(
    activityActivationMonitor: ActivityActivationMonitor,
    publisher: Publisher<number>,
  ) {
    this.activityActivationMonitor = activityActivationMonitor;
    this.publisher = publisher;
  }

  captureActivitiesNavigation(stack: Stack): void {
    const previousFocusCount =
      this.activityActivationMonitor.getActivationCount();

    this.activityActivationMonitor.captureActivitiesNavigation(stack);

    const currentFocusCount =
      this.activityActivationMonitor.getActivationCount();

    if (currentFocusCount !== previousFocusCount) {
      this.publisher.publish(currentFocusCount);
    }
  }

  getActivationCount(): number {
    return this.activityActivationMonitor.getActivationCount();
  }

  getTargetId(): string {
    return this.activityActivationMonitor.getTargetId();
  }
}

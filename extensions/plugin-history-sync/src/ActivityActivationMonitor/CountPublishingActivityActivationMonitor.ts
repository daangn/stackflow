import type { Stack } from "@stackflow/core";
import type { Publisher } from "../Publisher";
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
    const previousActivationCount =
      this.activityActivationMonitor.getActivationCount();

    this.activityActivationMonitor.captureActivitiesNavigation(stack);

    const currentActivationCount =
      this.activityActivationMonitor.getActivationCount();

    if (currentActivationCount !== previousActivationCount) {
      this.publisher.publish(currentActivationCount);
    }
  }

  getActivationCount(): number {
    return this.activityActivationMonitor.getActivationCount();
  }

  getTargetId(): string {
    return this.activityActivationMonitor.getTargetId();
  }
}

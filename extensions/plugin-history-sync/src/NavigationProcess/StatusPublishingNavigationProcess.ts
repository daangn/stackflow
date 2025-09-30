import type { Publisher } from "Publisher";
import type { PushedEvent, Stack, StepPushedEvent } from "@stackflow/core";
import type {
  NavigationProcess,
  NavigationProcessStatus,
} from "./NavigationProcess";

export class StatusPublishingNavigationProcess implements NavigationProcess {
  private process: NavigationProcess;
  private publisher: Publisher<NavigationProcessStatus>;
  private currentStatus: NavigationProcessStatus;

  constructor(
    process: NavigationProcess,
    publisher: Publisher<NavigationProcessStatus>,
  ) {
    this.process = process;
    this.publisher = publisher;
    this.currentStatus = process.getStatus();
  }

  captureNavigationOpportunity(
    stack: Stack | null,
    navigationTime: number,
  ): (PushedEvent | StepPushedEvent)[] {
    const events = this.process.captureNavigationOpportunity(
      stack,
      navigationTime,
    );

    this.refreshCurrentStatus(this.process.getStatus());

    return events;
  }

  getStatus(): NavigationProcessStatus {
    const originCurrentStatus = this.process.getStatus();

    this.refreshCurrentStatus(originCurrentStatus);

    return originCurrentStatus;
  }

  private refreshCurrentStatus(nextStatus: NavigationProcessStatus) {
    if (nextStatus !== this.currentStatus) {
      this.currentStatus = nextStatus;
      this.publisher.publish(nextStatus);
    }
  }
}

import type { NavigationEvent } from "NavigationEvent";
import type { PushedEvent, Stack, StepPushedEvent } from "@stackflow/core";
import {
  type NavigationProcess,
  NavigationProcessStatus,
} from "./NavigationProcess";

export class CompositNavigationProcess implements NavigationProcess {
  private base: NavigationProcess;
  private createDrived: (base: NavigationEvent[]) => NavigationProcess;
  private derived: NavigationProcess | null;
  private baseNavigationEvents: NavigationEvent[];

  constructor(
    base: NavigationProcess,
    createDrived: (base: NavigationEvent[]) => NavigationProcess,
  ) {
    this.base = base;
    this.createDrived = createDrived;
    this.derived = null;
    this.baseNavigationEvents = [];
  }

  captureNavigationOpportunity(
    stack: Stack | null,
    navigationTime: number,
  ): (PushedEvent | StepPushedEvent)[] {
    if (this.derived) {
      return this.derived.captureNavigationOpportunity(stack, navigationTime);
    }

    const events = this.base.captureNavigationOpportunity(
      stack,
      navigationTime,
    );

    if (
      events.length === 0 &&
      this.base.getStatus() === NavigationProcessStatus.SUCCEEDED
    ) {
      this.derived = this.createDrived(this.baseNavigationEvents);

      return this.derived.captureNavigationOpportunity(stack, navigationTime);
    }

    this.baseNavigationEvents.push(...events);

    return events;
  }

  getStatus(): NavigationProcessStatus {
    const baseStatus = this.base.getStatus();

    if (baseStatus === NavigationProcessStatus.SUCCEEDED) {
      if (!this.derived) {
        this.derived = this.createDrived(this.baseNavigationEvents);
      }

      const derivedStatus = this.derived.getStatus();

      if (derivedStatus === NavigationProcessStatus.IDLE)
        return NavigationProcessStatus.PROGRESS;

      return derivedStatus;
    }

    return baseStatus;
  }
}

import type { PushedEvent, Stack, StepPushedEvent } from "@stackflow/core";
import { isNavigationEvent, type NavigationEvent } from "../NavigationEvent";
import {
  isTerminated,
  type NavigationProcess,
  NavigationProcessStatus,
} from "./NavigationProcess";

export class SerialNavigationProcess implements NavigationProcess {
  private status: NavigationProcessStatus;
  private pendingNavigations: ((
    navigationTime: number,
  ) => (PushedEvent | StepPushedEvent)[])[];
  private dispatchedEvents: (PushedEvent | StepPushedEvent)[];
  private baseNavigationEvents: NavigationEvent[];

  constructor(
    navigations: ((
      navigationTime: number,
    ) => (PushedEvent | StepPushedEvent)[])[],
    baseNavigationEvents: NavigationEvent[] = [],
  ) {
    this.status =
      navigations.length > 0
        ? NavigationProcessStatus.IDLE
        : NavigationProcessStatus.SUCCEEDED;
    this.pendingNavigations = navigations.slice();
    this.dispatchedEvents = [];
    this.baseNavigationEvents = baseNavigationEvents;
  }

  captureNavigationOpportunity(
    stack: Stack | null,
    navigationTime: number,
  ): (PushedEvent | StepPushedEvent)[] {
    if (isTerminated(this.status)) return [];
    if (stack && stack.globalTransitionState !== "idle") return [];

    if (this.pendingNavigations.length === 0) {
      this.status = NavigationProcessStatus.SUCCEEDED;

      return [];
    }

    const navigationHistory = stack
      ? stack.events.filter(isNavigationEvent)
      : [];

    if (
      !(
        this.verifyAllDispatchedEventsAreInNavigationHistory(
          navigationHistory,
        ) && this.verifyNoUnknownNavigationEvents(navigationHistory)
      )
    ) {
      this.pendingNavigations = [];
      this.status = NavigationProcessStatus.FAILED;

      return [];
    }

    const nextNavigation = this.pendingNavigations.shift();

    if (!nextNavigation) return [];

    const nextNavigationEvents = nextNavigation(navigationTime);

    this.dispatchedEvents.push(...nextNavigationEvents);
    this.status = NavigationProcessStatus.PROGRESS;

    return nextNavigationEvents;
  }

  getStatus(): NavigationProcessStatus {
    return this.status;
  }

  private verifyAllDispatchedEventsAreInNavigationHistory(
    navigationHistory: NavigationEvent[],
  ): boolean {
    const navigationHistoryEventIds = new Set(
      navigationHistory.map((e) => e.id),
    );

    return this.dispatchedEvents.every((event) =>
      navigationHistoryEventIds.has(event.id),
    );
  }

  private verifyNoUnknownNavigationEvents(
    navigationHistory: NavigationEvent[],
  ): boolean {
    const knownNavigationEvents = new Set(
      [...this.baseNavigationEvents, ...this.dispatchedEvents].map((e) => e.id),
    );

    return navigationHistory.every((event) =>
      knownNavigationEvents.has(event.id),
    );
  }
}

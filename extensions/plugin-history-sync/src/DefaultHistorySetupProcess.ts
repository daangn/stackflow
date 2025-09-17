import type { HistoryEntry } from "RouteLike";
import {
  type DomainEvent,
  id,
  makeEvent,
  type PoppedEvent,
  type PushedEvent,
  type ReplacedEvent,
  type Stack,
  type StepPoppedEvent,
  type StepPushedEvent,
  type StepReplacedEvent,
} from "@stackflow/core";

export class DefaultHistorySetupProcess {
  private pendingDefaultHistoryEntries: HistoryEntry[];
  private entryPath: string;
  private dispatchedEvents: (PushedEvent | StepPushedEvent)[];

  constructor(defaultHistory: HistoryEntry[], entryPath: string) {
    this.pendingDefaultHistoryEntries = defaultHistory.slice();
    this.entryPath = entryPath;
    this.dispatchedEvents = [];
  }

  captureNavigationOpportunity(
    stack: Stack | null,
    navigationTime: number,
  ): (PushedEvent | StepPushedEvent)[] {
    if (stack !== null && stack.globalTransitionState !== "idle") return [];

    const navigationHistory = stack
      ? this.filterNavigationEvents(stack.events)
      : [];

    if (this.pendingDefaultHistoryEntries.length === 0) return [];
    if (!this.verifyNavigationHistoryIntegrity(navigationHistory)) {
      this.pendingDefaultHistoryEntries = [];

      return [];
    }

    const nextNavigationEntries = this.pendingDefaultHistoryEntries.splice(
      0,
      1,
    );
    const nextNavigationEvents = nextNavigationEntries.flatMap((entry) =>
      this.historyEntryToEvent(entry, navigationTime),
    );

    this.dispatchedEvents.push(...nextNavigationEvents);

    return nextNavigationEvents;
  }

  private historyEntryToEvent(
    { activityName, activityParams, additionalSteps = [] }: HistoryEntry,
    navigationTime: number,
  ): (PushedEvent | StepPushedEvent)[] {
    return [
      makeEvent("Pushed", {
        activityId: id(),
        activityName,
        activityParams: {
          ...activityParams,
        },
        eventDate: navigationTime,
        activityContext: {
          path: this.entryPath,
          lazyActivityComponentRenderContext: {
            shouldRenderImmediately: true,
          },
        },
      }),
      ...additionalSteps.map(({ stepParams, hasZIndex }) =>
        makeEvent("StepPushed", {
          stepId: id(),
          stepParams,
          hasZIndex,
        }),
      ),
    ];
  }

  private verifyNavigationHistoryIntegrity(
    navigationHistory: NavigationEvents[],
  ): boolean {
    if (navigationHistory.length !== this.dispatchedEvents.length) return false;
    return navigationHistory.every(
      (event, index) => event.id === this.dispatchedEvents[index].id,
    );
  }

  private filterNavigationEvents(events: DomainEvent[]): NavigationEvents[] {
    return events.filter(
      (event) =>
        event.name === "Pushed" ||
        event.name === "Popped" ||
        event.name === "Replaced" ||
        event.name === "StepPushed" ||
        event.name === "StepPopped" ||
        event.name === "StepReplaced",
    );
  }
}

export type NavigationEvents =
  | PushedEvent
  | PoppedEvent
  | ReplacedEvent
  | StepPushedEvent
  | StepPoppedEvent
  | StepReplacedEvent;

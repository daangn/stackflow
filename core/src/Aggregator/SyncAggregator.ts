import { produceEffects } from "produceEffects";
import { aggregate } from "../aggregate";
import type { Effect } from "../Effect";
import type { DomainEvent } from "../event-types";
import type { Stack } from "../Stack";
import type { Publisher } from "../utils/Publisher/Publisher";
import type { Aggregator } from "./Aggregator";

export class SyncAggregator implements Aggregator {
  private events: DomainEvent[];
  private changePublisher: Publisher<{ effects: Effect[]; stack: Stack }>;
  private autoUpdateTask: DynamicallyScheduledTask;
  private previousStack: Stack;

  constructor(
    events: DomainEvent[],
    changePublisher: Publisher<{ effects: Effect[]; stack: Stack }>,
  ) {
    this.events = events;
    this.changePublisher = changePublisher;
    this.autoUpdateTask = new DynamicallyScheduledTask(async () => {
      this.updateStack();
    });
    this.previousStack = this.computeStack();
  }

  getStack(): Stack {
    return this.previousStack;
  }

  dispatchEvent(event: DomainEvent): void {
    this.events.push(event);
    this.updateStack();
  }

  subscribeChanges(
    listener: (effects: Effect[], stack: Stack) => void,
  ): () => void {
    return this.changePublisher.subscribe(({ effects, stack }) => {
      listener(effects, stack);
    });
  }

  private computeStack(): Stack {
    return aggregate(this.events, Date.now());
  }

  private predictUpcomingTransitionStateUpdate(): {
    event: DomainEvent;
    timestamp: number;
  } | null {
    const stack = this.computeStack();
    const activeActivities = stack.activities.filter(
      (activity) =>
        activity.transitionState === "enter-active" ||
        activity.transitionState === "exit-active",
    );
    const mostRecentlyActivatedActivity = activeActivities.sort(
      (a, b) => a.estimatedTransitionEnd - b.estimatedTransitionEnd,
    )[0];

    return mostRecentlyActivatedActivity
      ? {
          event:
            mostRecentlyActivatedActivity.exitedBy ??
            mostRecentlyActivatedActivity.enteredBy,
          timestamp: mostRecentlyActivatedActivity.estimatedTransitionEnd,
        }
      : null;
  }

  private updateStack(): void {
    const previousStack = this.previousStack;
    const currentStack = this.computeStack();
    const effects = produceEffects(previousStack, currentStack);

    if (effects.length > 0) {
      this.changePublisher.publish({ effects, stack: currentStack });

      this.previousStack = currentStack;

      const upcomingTransitionStateUpdate =
        this.predictUpcomingTransitionStateUpdate();

      if (upcomingTransitionStateUpdate) {
        this.autoUpdateTask.schedule(upcomingTransitionStateUpdate.timestamp);
      }
    }
  }
}

class DynamicallyScheduledTask {
  private task: () => Promise<void>;
  private scheduleId: number | null;

  constructor(task: () => Promise<void>) {
    this.task = task;
    this.scheduleId = null;
  }

  schedule(timestamp: number): void {
    if (this.scheduleId !== null) {
      clearTimeout(this.scheduleId);
      this.scheduleId = null;
    }

    const timeoutId = setTimeout(
      () => {
        if (this.scheduleId !== timeoutId) return;
        if (Date.now() < timestamp) {
          this.schedule(timestamp);
          return;
        }

        this.task();
        this.scheduleId = null;
      },
      Math.max(0, timestamp - Date.now()),
    );

    this.scheduleId = timeoutId;
  }
}

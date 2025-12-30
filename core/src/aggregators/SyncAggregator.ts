import { produceEffects } from "produceEffects";
import { aggregate } from "../aggregate";
import type { Effect } from "../Effect";
import type { DomainEvent } from "../event-types";
import type { Stack } from "../Stack";
import type { Publisher } from "../utils/publishers/Publisher";
import type { Scheduler } from "../utils/schedulers/Scheduler";
import type { Aggregator } from "./Aggregator";

export class SyncAggregator implements Aggregator {
  private events: DomainEvent[];
  private changePublisher: Publisher<{ effects: Effect[]; stack: Stack }>;
  private updateScheduler: Scheduler;
  private previousStack: Stack;

  constructor(
    events: DomainEvent[],
    changePublisher: Publisher<{ effects: Effect[]; stack: Stack }>,
    updateScheduler: Scheduler,
  ) {
    this.events = events;
    this.changePublisher = changePublisher;
    this.updateScheduler = updateScheduler;
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
    const activeActivities = this.previousStack.activities.filter(
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
        this.updateScheduler.schedule(async () => {
          this.updateStack();
        });
      }
    }
  }
}

import { aggregate } from "../aggregate";
import type { Effect } from "../Effect";
import type { DomainEvent } from "../event-types";
import { produceEffects } from "../produceEffects";
import type { Stack } from "../Stack";
import { delay } from "../utils/delay";
import type { Publisher } from "../utils/publishers/Publisher";
import type { Scheduler } from "../utils/schedulers/Scheduler";
import type { Aggregator } from "./Aggregator";

export class SyncAggregator implements Aggregator {
  private events: DomainEvent[];
  private latestStackSnapshot: Stack;
  private changePublisher: Publisher<{ effects: Effect[]; stack: Stack }>;
  private updateScheduler: Scheduler;

  constructor(options: {
    initialEvents: DomainEvent[];
    changePublisher: Publisher<{ effects: Effect[]; stack: Stack }>;
    updateScheduler: Scheduler;
  }) {
    this.events = options.initialEvents;
    this.latestStackSnapshot = aggregate(this.events, Date.now());
    this.changePublisher = options.changePublisher;
    this.updateScheduler = options.updateScheduler;
  }

  getStack(): Stack {
    return this.latestStackSnapshot;
  }

  dispatchEvent(event: DomainEvent): void {
    this.events.push(event);
    this.updateSnapshot();
  }

  subscribeChanges(
    listener: (effects: Effect[], stack: Stack) => void,
  ): () => void {
    return this.changePublisher.subscribe(({ effects, stack }) => {
      listener(effects, stack);
    });
  }

  private updateSnapshot(): void {
    const previousSnapshot = this.latestStackSnapshot;
    const currentSnapshot = aggregate(this.events, Date.now());
    const effects = produceEffects(previousSnapshot, currentSnapshot);

    if (effects.length > 0) {
      this.latestStackSnapshot = currentSnapshot;
      this.changePublisher.publish({
        effects,
        stack: this.latestStackSnapshot,
      });
    }

    const earliestUpcomingTransitionStateUpdate =
      this.calculateEarliestUpcomingTransitionStateUpdate();

    if (earliestUpcomingTransitionStateUpdate) {
      this.updateScheduler.schedule(async (options) => {
        await delay(
          earliestUpcomingTransitionStateUpdate.timestamp - Date.now(),
          { signal: options?.signal },
        );

        if (options?.signal?.aborted) return;

        this.updateSnapshot();
      });
    }
  }

  private calculateEarliestUpcomingTransitionStateUpdate(): {
    event: DomainEvent;
    timestamp: number;
  } | null {
    const activeActivities = this.latestStackSnapshot.activities.filter(
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
}

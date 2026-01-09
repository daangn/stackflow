import { SwitchScheduler } from "utils/schedulers/SwitchScheduler";
import { aggregate } from "../aggregate";
import type { Effect } from "../Effect";
import type { DomainEvent } from "../event-types";
import { produceEffects } from "../produceEffects";
import { projectToOngoingTransitions } from "../projectToOngoingTransitions";
import type { Stack } from "../Stack";
import { delay } from "../utils/delay";
import { getAbortReason } from "../utils/getAbortReason";
import type { Publisher } from "../utils/publishers/Publisher";
import type { Scheduler } from "../utils/schedulers/Scheduler";
import type { Aggregator } from "./Aggregator";

export class SyncAggregator implements Aggregator {
  private changePublisher: Publisher<{ effects: Effect[]; stack: Stack }>;
  private updateScheduler: SwitchScheduler;
  private events: DomainEvent[];
  private latestStackSnapshot: Stack | null;

  private static UpdateOverridedError =
    class UpdateOverridedError extends Error {
      constructor() {
        super("a new update is scheduled");
      }
    };

  constructor(options: {
    changePublisher: Publisher<{ effects: Effect[]; stack: Stack }>;
    updateScheduler: Scheduler;
    initialEvents: DomainEvent[];
  }) {
    this.changePublisher = options.changePublisher;
    this.updateScheduler = new SwitchScheduler({
      SwitchException: SyncAggregator.UpdateOverridedError,
      scheduler: options.updateScheduler,
    });
    this.events = options.initialEvents;
    this.latestStackSnapshot = null;
  }

  getStack(): Stack {
    return this.readSnapshot();
  }

  dispatchEvent(event: DomainEvent): void {
    this.applyUpdate(() => {
      this.events.push(event);
    });
  }

  subscribeChanges(
    listener: (effects: Effect[], stack: Stack) => void,
  ): () => void {
    return this.changePublisher.subscribe(({ effects, stack }) => {
      listener(effects, stack);
    });
  }

  private readSnapshot(): Stack {
    if (this.latestStackSnapshot === null) {
      this.latestStackSnapshot = aggregate(this.events, Date.now());
    }

    return this.latestStackSnapshot;
  }

  private applyUpdate(update: () => void): void {
    const previousSnapshot = this.readSnapshot();

    update();
    this.latestStackSnapshot = aggregate(this.events, Date.now());
    this.flushChanges(
      produceEffects(previousSnapshot, this.latestStackSnapshot),
    );
    this.scheduleTransitionStateUpdates();
  }

  private flushChanges(effects: Effect[]): void {
    if (effects.length === 0) return;

    this.changePublisher.publish({ effects, stack: this.readSnapshot() });
  }

  private scheduleTransitionStateUpdates(): void {
    const ongoingTransitions = projectToOngoingTransitions(
      this.events,
      Date.now(),
    );
    const nextToComplete = ongoingTransitions.sort(
      (a, b) => a.estimatedTransitionEnd - b.estimatedTransitionEnd,
    )[0];

    if (!nextToComplete) return;

    this.updateScheduler
      .schedule(async (options) => {
        await delay(nextToComplete.estimatedTransitionEnd - Date.now(), {
          signal: options?.signal,
        });

        if (options?.signal?.aborted) throw getAbortReason(options.signal);

        this.applyUpdate(() => {});
      })
      .catch((error) => {
        if (
          error instanceof SyncAggregator.UpdateOverridedError ||
          (error instanceof DOMException && error.name === "AbortError")
        )
          return;

        throw error;
      });
  }
}

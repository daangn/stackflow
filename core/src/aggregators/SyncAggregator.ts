import { head } from "lodash";
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
import type { Aggregator } from "./Aggregator";

export class SyncAggregator implements Aggregator {
  private changePublisher: Publisher<{ effects: Effect[]; stack: Stack }>;
  private updateScheduler: SwitchScheduler;
  private updateErrorReporter: (error: unknown) => void;
  private events: DomainEvent[];
  private latestStackSnapshot: Stack | null;

  constructor(options: {
    changePublisher: Publisher<{ effects: Effect[]; stack: Stack }>;
    updateScheduler: SwitchScheduler;
    updateErrorReporter: (error: unknown) => void;
    initialEvents: DomainEvent[];
  }) {
    this.changePublisher = options.changePublisher;
    this.updateScheduler = options.updateScheduler;
    this.updateErrorReporter = options.updateErrorReporter;
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
    try {
      const previousSnapshot = this.readSnapshot();
      const projectionTime = Date.now();

      update();
      this.latestStackSnapshot = aggregate(this.events, projectionTime);
      this.flushChanges(
        produceEffects(previousSnapshot, this.latestStackSnapshot),
      );
      this.scheduleTransitionStateUpdates(projectionTime);
    } catch (error) {
      this.updateErrorReporter(error);
    }
  }

  private flushChanges(effects: Effect[]): void {
    if (effects.length === 0) return;

    this.changePublisher.publish({ effects, stack: this.readSnapshot() });
  }

  private scheduleTransitionStateUpdates(projectionTime: number): void {
    const ongoingTransitions = projectToOngoingTransitions(
      this.events,
      projectionTime,
    );
    const nextToComplete = head(
      ongoingTransitions.sort(
        (a, b) => a.estimatedTransitionEnd - b.estimatedTransitionEnd,
      ),
    );

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
          error instanceof SwitchScheduler.SwitchException ||
          (error instanceof DOMException && error.name === "AbortError")
        )
          return;

        this.updateErrorReporter(error);
      });
  }
}

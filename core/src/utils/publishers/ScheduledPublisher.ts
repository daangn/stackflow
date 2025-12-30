import type { Scheduler } from "../schedulers/Scheduler";
import type { Publisher } from "./Publisher";

export class ScheduledPublisher<T> implements Publisher<T> {
  private scheduler: Scheduler;
  private subscribers: ((value: T) => void)[];
  private handlePublishError: (error: unknown, value: T) => void;

  constructor(
    scheduler: Scheduler,
    options?: { handlePublishError?: (error: unknown, value: T) => void },
  ) {
    this.scheduler = scheduler;
    this.subscribers = [];
    this.handlePublishError = options?.handlePublishError ?? (() => {});
  }

  publish(value: T): void {
    const subscribers = this.subscribers.slice();

    this.scheduler.schedule(async () => {
      for (const subscriber of subscribers) {
        try {
          subscriber(value);
        } catch (error) {
          this.handlePublishError(error, value);
        }
      }
    });
  }

  subscribe(subscriber: (value: T) => void): () => void {
    this.subscribers.push(subscriber);

    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== subscriber);
    };
  }
}

import type { TaskQueue } from "../TaskQueue/TaskQueue";
import type { Publisher } from "./Publisher";

export class QueuingPublisher<T> implements Publisher<T> {
  private taskQueue: TaskQueue;
  private subscribers: ((value: T) => void)[] = [];
  private errorHandler: (error: unknown) => void;

  constructor(
    taskQueue: TaskQueue,
    options?: { errorHandler?: (error: unknown) => void },
  ) {
    this.taskQueue = taskQueue;
    this.errorHandler = options?.errorHandler ?? (() => {});
  }

  publish(
    value: T,
    options?: { onPublishError?: (error: unknown) => void },
  ): void {
    const subscribers = this.subscribers.slice();
    const publishTask = this.taskQueue.enqueue(async () => {
      for (const subscriber of subscribers) {
        try {
          subscriber(value);
        } catch (error) {
          options?.onPublishError?.(error);
        }
      }
    });

    publishTask.finished.catch(this.errorHandler);
  }

  subscribe(subscriber: (value: T) => void): () => void {
    this.subscribers.push(subscriber);

    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== subscriber);
    };
  }
}

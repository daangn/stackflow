import { Mutex } from "Mutex";

export class Publisher<T> {
  private subscribers: ((value: T) => Promise<void>)[] = [];
  private publishLock: Mutex = new Mutex();

  subscribe(subscriber: (value: T) => Promise<void>): () => void {
    this.subscribers.push(subscriber);

    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== subscriber);
    };
  }

  publish(value: T): Promise<PromiseSettledResult<void>[]> {
    const targetSubcribers = this.subscribers.slice();

    return this.publishLock.runExclusively(() =>
      Promise.allSettled(
        targetSubcribers.map((subscriber) => subscriber(value)),
      ),
    );
  }
}

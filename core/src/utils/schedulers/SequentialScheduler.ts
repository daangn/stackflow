import type { Mutex } from "../Mutex";
import type { Scheduler } from "./Scheduler";

export class SequentialScheduler implements Scheduler {
  private executionLock: Mutex;

  constructor(executionLock: Mutex) {
    this.executionLock = executionLock;
  }

  async schedule<T>(
    task: (options?: { signal?: AbortSignal }) => Promise<T>,
    options?: { signal?: AbortSignal },
  ): Promise<T> {
    const { release } = await this.executionLock.acquire({
      signal: options?.signal,
    });

    try {
      return await task({ signal: options?.signal });
    } finally {
      release();
    }
  }
}

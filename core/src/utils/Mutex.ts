import { SequentialScheduler } from "./schedulers/SequentialScheduler";

export class Mutex {
  private sequentialScheduler: SequentialScheduler = new SequentialScheduler();

  acquire(options?: { signal?: AbortSignal }): Promise<LockHandle> {
    return new Promise((resolve, reject) => {
      this.sequentialScheduler.schedule(
        () =>
          new Promise<void>((release) => resolve({ release: () => release() })),
        { signal: options?.signal },
      );
    });
  }
}

export interface LockHandle {
  release: () => void;
}

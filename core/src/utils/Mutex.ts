import { getAbortReason } from "./getAbortReason";

export class Mutex {
  private lockWaitQueue: ((lockHandle: LockHandle) => void)[] = [];
  private waitQueueFlushTask: Promise<void> | null = null;

  acquire(options?: { signal?: AbortSignal }): Promise<LockHandle> {
    return new Promise((resolve, reject) => {
      const signal = options?.signal;
      const abortHandler = () => {
        if (!signal) return;

        this.lockWaitQueue = this.lockWaitQueue.filter((h) => h !== resolve);

        reject(getAbortReason(signal));
      };
      const lockWaiter = (lockHandle: LockHandle) => {
        resolve(lockHandle);

        signal?.removeEventListener("abort", abortHandler);
      };

      if (signal?.aborted) throw getAbortReason(signal);

      signal?.addEventListener("abort", abortHandler, { once: true });

      this.lockWaitQueue.push(lockWaiter);
      this.scheduleWaitQueueFlush();
    });
  }

  private scheduleWaitQueueFlush(): void {
    if (this.waitQueueFlushTask) return;

    this.waitQueueFlushTask = Promise.resolve().then(async () => {
      do {
        const nextWaiter = this.lockWaitQueue.shift();

        if (!nextWaiter) break;

        await new Promise<void>((resolve) => nextWaiter({ release: resolve }));
      } while (this.lockWaitQueue.length > 0);

      this.waitQueueFlushTask = null;
    });
  }
}

export interface LockHandle {
  release: () => void;
}

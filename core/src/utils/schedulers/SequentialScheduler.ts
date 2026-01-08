import { getAbortReason } from "../getAbortReason";
import type { Scheduler } from "./Scheduler";

export class SequentialScheduler implements Scheduler {
  private taskRunnerQueue: (() => Promise<void>)[] = [];
  private taskRunnerQueueFlushTask: Promise<void> | null = null;

  schedule<T>(
    task: (options?: { signal?: AbortSignal }) => Promise<T>,
    options?: { signal?: AbortSignal },
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const signal = options?.signal;

      if (signal?.aborted) throw getAbortReason(signal);

      const abortHandler = () => {
        if (!signal) return;

        this.taskRunnerQueue = this.taskRunnerQueue.filter(
          (r) => r !== taskRunner,
        );

        reject(getAbortReason(signal));
      };
      const taskRunner = async () => {
        if (signal?.aborted) {
          abortHandler();

          return;
        }

        try {
          resolve(await task({ signal }));
        } catch (error) {
          reject(error);
        } finally {
          signal?.removeEventListener("abort", abortHandler);
        }
      };

      this.taskRunnerQueue.push(taskRunner);

      signal?.addEventListener("abort", abortHandler, { once: true });

      this.flushTaskRunnerQueue();
    });
  }

  private flushTaskRunnerQueue(): void {
    if (this.taskRunnerQueueFlushTask) return;

    this.taskRunnerQueueFlushTask = Promise.resolve().then(async () => {
      while (this.taskRunnerQueue.length > 0) {
        const nextTask = this.taskRunnerQueue.shift();

        if (!nextTask) break;

        await nextTask();
      }

      this.taskRunnerQueueFlushTask = null;
    });
  }
}

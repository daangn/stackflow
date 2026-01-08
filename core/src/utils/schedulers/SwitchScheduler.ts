import { getAbortReason } from "../getAbortReason";
import { sumSignals } from "../sumSignals";
import type { Scheduler } from "./Scheduler";
import { SequentialScheduler } from "./SequentialScheduler";

export class SwitchScheduler implements Scheduler {
  private sequentialScheduler: SequentialScheduler = new SequentialScheduler();
  private previousTaskController: AbortController | null = null;

  async schedule<T>(
    task: (options?: { signal?: AbortSignal }) => Promise<T>,
    options?: { signal?: AbortSignal },
  ): Promise<T> {
    const controller = new AbortController();
    const signal = options?.signal
      ? sumSignals([options.signal, controller.signal])
      : controller.signal;

    if (signal.aborted) throw getAbortReason(signal);

    if (this.previousTaskController) {
      this.previousTaskController.abort(new Error("a new task is scheduled"));
    }

    this.previousTaskController = controller;

    return await this.sequentialScheduler.schedule(task, {
      signal,
    });
  }
}

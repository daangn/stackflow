import { getAbortReason } from "../getAbortReason";
import { sumSignals } from "../sumSignals";
import type { Scheduler } from "./Scheduler";

export class SwitchScheduler implements Scheduler {
  private SwitchException: new (
    message?: string,
  ) => Error;
  private scheduler: Scheduler;
  private previousTaskController: AbortController | null = null;

  constructor(options: {
    SwitchException: new (message?: string) => Error;
    scheduler: Scheduler;
  }) {
    this.SwitchException = options.SwitchException;
    this.scheduler = options.scheduler;
  }

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
      this.previousTaskController.abort(
        new this.SwitchException("a new task is scheduled"),
      );
    }

    this.previousTaskController = controller;

    return this.scheduler.schedule(task, {
      signal,
    });
  }
}

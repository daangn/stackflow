import { Mutex } from "utils/Mutex";
import type { QueuedTask, TaskQueue } from "./TaskQueue";

export class ExclusiveTaskQueue implements TaskQueue {
  private taskRunLock: Mutex = new Mutex();

  enqueue<T>(task: () => Promise<T>): QueuedTask<T> {
    return {
      finished: this.taskRunLock.runExclusively(task),
    };
  }
}

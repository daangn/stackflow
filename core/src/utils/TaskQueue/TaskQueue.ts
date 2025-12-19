export interface TaskQueue {
  enqueue<T>(task: () => Promise<T>): QueuedTask<T>;
}

export interface QueuedTask<T> {
  finished: Promise<T>;
}

export interface Scheduler {
  schedule<T>(
    task: (options?: { signal?: AbortSignal }) => Promise<T>,
    options?: { signal?: AbortSignal },
  ): Promise<T>;
}

import type { History } from "history";

/**
 * This function is required to avoid any race conditions caused by asynchronous history updates.
 */
export const makeHistoryTaskQueue = (history: History) => {
  let previousTask = Promise.resolve();

  const enqueue = (cb: () => void) => {
    previousTask = previousTask.then(
      () =>
        new Promise<void>((resolve) => {
          const clean = history.listen(() => {
            clean();
            resolve();
          });

          cb();
        }),
    );
  };

  return { enqueue };
};

import type { History } from "history";
import type { HistoryQueueContextValue } from "HistoryQueueContext";

/**
 * This function is required to avoid any race conditions caused by asynchronous history updates.
 */
export const makeHistoryTaskQueue = (history: History) => {
  let previousTask = Promise.resolve();

  const enqueue: HistoryQueueContextValue["enqueue"] = (
    cb: () => void,
    listen: boolean = true,
  ) => {
    previousTask = previousTask.then(
      () =>
        new Promise<void>((resolve) => {
          if (listen) {
            const clean = history.listen(() => {
              clean();
              resolve();
            });
          }

          cb();

          if (!listen) {
            resolve();
          }
        }),
    );
  };

  return { enqueue };
};

import type { History } from "history";

export type RequestHistoryTick = (cb: (resolve: () => void) => void) => void;

/**
 * This function is required to avoid any race conditions caused by asynchronous history updates.
 */
export const makeHistoryTaskQueue = (history: History) => {
  let previousTask = Promise.resolve();

  const requestHistoryTick: RequestHistoryTick = (cb) => {
    previousTask = previousTask.then(
      () =>
        new Promise<void>((resolve) => {
          const clean = history.listen(() => {
            clean();
            resolve();
          });

          cb(() => {
            clean();
            resolve();
          });
        }),
    );
  };

  return { requestHistoryTick };
};

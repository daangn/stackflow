import type { History } from "history";

/**
 * This function is required to avoid any race conditions caused by asynchronous history updates.
 */
export const makeQueue = (history: History) => {
  let pending = false;

  const queue = (cb: () => void) => {
    const start = () => {
      pending = true;
      const clean = history.listen(() => {
        clean();
        pending = false;
      });

      cb();
    };

    if (pending) {
      const clean = history.listen(() => {
        clean();
        start();
      });
    } else {
      start();
    }
  };

  return queue;
};

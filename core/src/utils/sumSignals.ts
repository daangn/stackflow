import { getAbortReason } from "./getAbortReason";

export function sumSignals(signals: Iterable<AbortSignal>): AbortSignal {
  const controller = new AbortController();
  const abortHandlerCleanups: (() => void)[] = [];

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(getAbortReason(signal));

      for (const cleanup of abortHandlerCleanups) {
        cleanup();
      }

      break;
    }

    const abortHandler = () => {
      controller.abort(getAbortReason(signal));

      for (const cleanup of abortHandlerCleanups) {
        cleanup();
      }
    };

    signal.addEventListener("abort", abortHandler);
    abortHandlerCleanups.push(() =>
      signal.removeEventListener("abort", abortHandler),
    );
  }

  return controller.signal;
}

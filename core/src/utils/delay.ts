import { getAbortReason } from "./getAbortReason";

export function delay(
  ms: number,
  options?: { signal?: AbortSignal },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const signal = options?.signal;

    if (signal?.aborted) throw getAbortReason(signal);

    const abortHandler = () => {
      if (!signal) return;

      clearTimeout(timeoutId);
      reject(getAbortReason(signal));
    };
    const timeoutId = setTimeout(() => {
      if (signal?.aborted) abortHandler();
      else resolve();

      signal?.removeEventListener("abort", abortHandler);
    }, ms);

    signal?.addEventListener("abort", abortHandler, { once: true });
  });
}

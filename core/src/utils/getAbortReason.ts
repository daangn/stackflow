export function getAbortReason(signal: AbortSignal): unknown {
  if (!signal.aborted) throw new Error("the signal was not aborted");

  return (
    signal.reason ?? new DOMException("an operation was aborted", "AbortError")
  );
}

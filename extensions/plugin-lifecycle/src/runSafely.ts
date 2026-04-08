export function runSafely(
  fn: (() => (() => void) | void) | void | undefined,
): (() => void) | void {
  if (typeof fn !== "function") {
    return;
  }
  try {
    return fn();
  } catch (e) {
    console.error(e);
  }
}

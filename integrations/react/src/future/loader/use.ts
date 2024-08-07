// @ts-nocheck

export function use<T>(promise: Promise<T> | T): T {
  if (!(promise instanceof Promise)) {
    return promise;
  }

  if (promise.status === "fulfilled") {
    return promise.value;
    // biome-ignore lint/style/noUselessElse: <explanation>
  } else if (promise.status === "rejected") {
    throw promise.reason;
    // biome-ignore lint/style/noUselessElse: <explanation>
  } else if (promise.status === "pending") {
    throw promise;
    // biome-ignore lint/style/noUselessElse: <explanation>
  } else {
    promise.status = "pending";
    promise.then(
      (result: any) => {
        promise.status = "fulfilled";
        promise.value = result;
      },
      (reason: any) => {
        promise.status = "rejected";
        promise.reason = reason;
      },
    );
    throw promise;
  }
}

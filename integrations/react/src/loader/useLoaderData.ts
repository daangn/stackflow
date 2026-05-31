import type { ActivityLoaderArgs } from "@stackflow/config";
import { resolve } from "../utils/SyncInspectablePromise";
import { useThenable } from "../utils/useThenable";
import { useActivity } from "../activity/useActivity";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): Awaited<ReturnType<T>> {
  return useThenable(resolve((useActivity().context as any)?.loaderData));
}

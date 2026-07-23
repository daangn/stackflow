import type { ActivityLoaderArgs } from "@stackflow/config";
import { resolve } from "../utils/SyncInspectablePromise";
import { useThenable } from "../utils/useThenable";
import { useLoaderDataPromise } from "./LoaderDataContext";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): Awaited<ReturnType<T>> {
  return useThenable(resolve(useLoaderDataPromise())) as Awaited<ReturnType<T>>;
}

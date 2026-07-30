import type { ActivityLoaderArgs } from "@stackflow/config";
import { resolve } from "../utils/SyncInspectablePromise";
import { useThenable } from "../utils/useThenable";
import { useLoaderResultPromise } from "./LoaderResultContext";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): Awaited<ReturnType<T>> {
  return useThenable(resolve(useLoaderResultPromise())) as Awaited<
    ReturnType<T>
  >;
}

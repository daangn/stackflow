import type { ActivityLoaderArgs } from "@stackflow/config";
import { useContext } from "react";
import { resolve } from "../utils/SyncInspectablePromise";
import { useThenable } from "../utils/useThenable";
import { LoaderResultContext } from "./LoaderResultContext";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): Awaited<ReturnType<T>> {
  return useThenable(resolve(useContext(LoaderResultContext))) as Awaited<
    ReturnType<T>
  >;
}

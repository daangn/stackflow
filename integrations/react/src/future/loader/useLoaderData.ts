import type { ActivityLoaderArgs } from "@stackflow/config";
import { useContext } from "react";
import { resolve } from "../../__internal__/utils/SyncInspectablePromise";
import { useThenable } from "../../__internal__/utils/useThenable";
import { useActivity } from "../../stable";
import { ActivityLoaderContext } from "./ActivityLoaderContext";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): Awaited<ReturnType<T>> {
  const context = useContext(ActivityLoaderContext);
  const activity = useActivity();

  // ActivityLoaderProvider가 있으면 context에서 가져옴, 없으면 activity.context에서 가져옴
  const loaderData = context
    ? context.loaderData
    : (activity.context as any)?.loaderData;

  return useThenable(resolve(loaderData));
}

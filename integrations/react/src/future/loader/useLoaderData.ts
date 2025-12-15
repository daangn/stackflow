import type { ActivityLoaderArgs } from "@stackflow/config";
import { liftValue } from "../../__internal__/utils/SyncInspectablePromise";
import { useThenable } from "../../__internal__/utils/useThenable";
import { useActivity } from "../../stable";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): Awaited<ReturnType<T>> {
  return useThenable(liftValue((useActivity().context as any)?.loaderData));
}

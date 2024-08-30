import type { ActivityLoaderArgs } from "@stackflow/config";
import type { Accessor } from "solid-js";
import { useActivity } from "../../stable";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): Accessor<ReturnType<T>> {
  const activity = useActivity();
  return () => (activity()?.context as any)?.loaderData;
}

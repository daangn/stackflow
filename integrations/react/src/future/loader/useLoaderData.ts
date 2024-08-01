import type { ActivityLoaderArgs } from "@stackflow/config";
import { useActivity } from "../../stable";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): ReturnType<T> {
  return (useActivity().context as any)?.loaderData;
}

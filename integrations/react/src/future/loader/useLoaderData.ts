import type { ActivityLoaderArgs } from "@stackflow/config";
import { useActivity } from "../../stable";
import { use } from "./use";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): Awaited<ReturnType<T>> {
  return use((useActivity().context as any)?.loaderData);
}

import type { ActivityLoaderArgs } from "@stackflow/config";
import { use } from "react18-use";
import { useActivity } from "../../stable";

export function useLoaderData<
  T extends (args: ActivityLoaderArgs<any>) => any,
>(): Awaited<ReturnType<T>> {
  return use((useActivity().context as any)?.loaderData);
}

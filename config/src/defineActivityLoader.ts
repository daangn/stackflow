import type { ActivityLoader } from "./ActivityLoader";
import type { InferActivityParams } from "./InferActivityParams";

export function defineActivityLoader<T extends string>(
  loader: ActivityLoader<InferActivityParams<T>>,
): ActivityLoader<any> {
  return loader;
}

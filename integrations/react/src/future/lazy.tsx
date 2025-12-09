import type { LazyActivityComponentType } from "../__internal__/LazyActivityComponentType";
import type { StaticActivityComponentType } from "../__internal__/StaticActivityComponentType";
import { optimizableLazyComponent } from "../__internal__/utils/OptimizableLazyComponent";
import {
  inspect,
  makeSyncInspectable,
  PromiseStatus,
  type SyncInspectablePromise,
} from "../__internal__/utils/SyncInspectablePromise";

export function lazy<T extends { [K in keyof T]: any } = {}>(
  load: () => Promise<{ default: StaticActivityComponentType<T> }>,
): LazyActivityComponentType<T> {
  let cachedValue: SyncInspectablePromise<{
    default: StaticActivityComponentType<T>;
  }> | null = null;

  const cachedLoad = () => {
    if (
      !cachedValue ||
      inspect(cachedValue).status === PromiseStatus.REJECTED
    ) {
      cachedValue = makeSyncInspectable(load());
    }

    return cachedValue;
  };

  const LazyActivityComponent: LazyActivityComponentType<T> = Object.assign(
    optimizableLazyComponent(cachedLoad),
    {
      _load: cachedLoad,
    },
  );

  return LazyActivityComponent;
}

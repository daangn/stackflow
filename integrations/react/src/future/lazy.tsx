import type { LazyActivityComponentType } from "../__internal__/LazyActivityComponentType";
import type { StaticActivityComponentType } from "../__internal__/StaticActivityComponentType";
import { preloadableLazyComponent } from "../__internal__/utils/PreloadableLazyComponent";
import {
  inspect,
  liftValue,
  PromiseStatus,
} from "../__internal__/utils/SyncInspectablePromise";

export function lazy<T extends { [K in keyof T]: any } = {}>(
  load: () => Promise<{ default: StaticActivityComponentType<T> }>,
): LazyActivityComponentType<T> {
  const { Component, preload } = preloadableLazyComponent(() =>
    liftValue(load()),
  );

  const LazyActivityComponent: LazyActivityComponentType<T> = Object.assign(
    Component,
    {
      _load: () => {
        const preloadTask = liftValue(preload());

        if (inspect(preloadTask).status === PromiseStatus.FULFILLED) {
          return liftValue({ default: Component });
        }

        return liftValue(preloadTask.then(() => ({ default: Component })));
      },
    },
  );

  return LazyActivityComponent;
}

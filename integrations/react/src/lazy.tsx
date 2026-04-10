import type { LazyActivityComponentType } from "./LazyActivityComponentType";
import type { StaticActivityComponentType } from "./BaseStaticActivityComponentType";
import { preloadableLazyComponent } from "./utils/PreloadableLazyComponent";
import {
  inspect,
  PromiseStatus,
  reject,
  resolve,
} from "./utils/SyncInspectablePromise";

export function lazy<T extends { [K in keyof T]: any } = {}>(
  load: () => Promise<{ default: StaticActivityComponentType<T> }>,
): LazyActivityComponentType<T> {
  const { Component, preload } = preloadableLazyComponent(() =>
    resolve(load()),
  );

  const LazyActivityComponent: LazyActivityComponentType<T> = Object.assign(
    Component,
    {
      _load: () => {
        const preloadTask = resolve(preload());
        const preloadTaskState = inspect(preloadTask);

        if (preloadTaskState.status === PromiseStatus.FULFILLED) {
          return resolve({ default: Component });
        } else if (preloadTaskState.status === PromiseStatus.REJECTED) {
          return reject(preloadTaskState.reason);
        }

        return resolve(preloadTask.then(() => ({ default: Component })));
      },
    },
  );

  return LazyActivityComponent;
}

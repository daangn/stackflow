import type { ComponentType } from "react";
import {
  inspect,
  PromiseStatus,
  resolve,
  type SyncInspectablePromise,
} from "./SyncInspectablePromise";
import { useThenable } from "./useThenable";

export function preloadableLazyComponent<P extends {}>(
  load: () => SyncInspectablePromise<{ default: ComponentType<P> }>,
): { Component: ComponentType<P>; preload: () => Promise<void> } {
  let cachedLoadingPromise: SyncInspectablePromise<{
    default: ComponentType<P>;
  }> | null = null;
  const cachedLoad = () => {
    if (
      !cachedLoadingPromise ||
      inspect(cachedLoadingPromise).status === PromiseStatus.REJECTED
    ) {
      cachedLoadingPromise = load();
    }

    return cachedLoadingPromise;
  };
  const Component = (props: P) => {
    const { default: Component } = useThenable(cachedLoad());

    return <Component {...props} />;
  };

  return {
    Component,
    preload: () => {
      const componentPromise = cachedLoad();

      if (inspect(componentPromise).status === PromiseStatus.FULFILLED) {
        return resolve(undefined);
      }

      return componentPromise.then(() => undefined);
    },
  };
}

import type { ComponentType } from "react";
import { use } from "../../future/loader/use";
import {
  inspect,
  PromiseStatus,
  type SyncInspectablePromise,
} from "./SyncInspectablePromise";

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
    const { default: Component } = use(cachedLoad());

    return <Component {...props} />;
  };

  return {
    Component,
    preload: async () => void (await cachedLoad()),
  };
}

import type { ComponentType } from "react";
import { use } from "../../future/loader/use";

export function optimizableLazyComponent<P extends {}>(
  load: () => Promise<{ default: ComponentType<P> }>,
): ComponentType<P> {
  return function OptimizableLazyComponent(props) {
    const { default: Component } = use(load());

    return <Component {...props} />;
  };
}

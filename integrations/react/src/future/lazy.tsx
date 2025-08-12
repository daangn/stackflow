import React, { Suspense, type ReactNode } from "react";
import type { LazyActivityComponentType } from "../__internal__/LazyActivityComponentType";
import type { StaticActivityComponentType } from "../__internal__/StaticActivityComponentType";

export interface LazyActivityComponentConfig {
  buildPlaceholder?: () => ReactNode;
}

export function lazy<T extends { [K in keyof T]: any } = {}>(
  load: () => Promise<{ default: StaticActivityComponentType<T> }>,
  config?: LazyActivityComponentConfig,
): LazyActivityComponentType<T> {
  let cachedValue: { default: StaticActivityComponentType<T> } | null = null;

  const cachedLoad = async () => {
    if (!cachedValue) {
      const value = await load();
      cachedValue = value;
    }
    return cachedValue;
  };

  const LazyLoadedActivityComponent = React.lazy(cachedLoad);
  const LazyActivityComponent: LazyActivityComponentType<T> = ({
    params,
    shouldRenderImmediately,
  }) => {
    const placeholder = config?.buildPlaceholder?.();

    if (placeholder && shouldRenderImmediately) {
      return (
        <Suspense fallback={placeholder}>
          <LazyLoadedActivityComponent params={params} />
        </Suspense>
      );
    }

    return <LazyLoadedActivityComponent params={params} />;
  };
  LazyActivityComponent._load = cachedLoad;

  return LazyActivityComponent;
}

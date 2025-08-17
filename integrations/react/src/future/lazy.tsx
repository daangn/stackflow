import React from "react";
import type { LazyActivityComponentType } from "../__internal__/LazyActivityComponentType";
import type { StaticActivityComponentType } from "../__internal__/StaticActivityComponentType";

export function lazy<T extends { [K in keyof T]: any } = {}>(
  load: () => Promise<{ default: StaticActivityComponentType<T> }>,
): LazyActivityComponentType<T> {
  let cachedValue: Promise<{ default: StaticActivityComponentType<T> }> | null =
    null;

  const cachedLoad = () => {
    if (!cachedValue) {
      cachedValue = load();
      cachedValue.catch((error) => {
        cachedValue = null;

        throw error;
      });
    }
    return cachedValue;
  };

  const LazyActivityComponent: LazyActivityComponentType<T> =
    React.lazy(cachedLoad);
  LazyActivityComponent._load = cachedLoad;

  return LazyActivityComponent;
}

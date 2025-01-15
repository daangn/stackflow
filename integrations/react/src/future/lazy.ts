import React from "react";
import type { LazyActivityComponentType } from "../__internal__/LazyActivityComponentType";
import type { StaticActivityComponentType } from "../__internal__/StaticActivityComponentType";

export function lazy<T extends { [K in keyof T]: any } = {}>(
  load: () => Promise<{ default: StaticActivityComponentType<T> }>,
): LazyActivityComponentType<T> {
  let cachedValue: { default: StaticActivityComponentType<T> } | null = null;

  const cachedLoad = async () => {
    if (!cachedValue) {
      const value = await load();
      cachedValue = value;
    }
    return cachedValue;
  };

  const LazyComponent: LazyActivityComponentType<T> = React.lazy(cachedLoad);
  LazyComponent._load = cachedLoad;

  return LazyComponent;
}

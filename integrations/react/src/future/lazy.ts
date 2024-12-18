import React from "react";
import type { ActivityComponentType } from "../__internal__/ActivityComponentType";
import type { LazyActivityComponentType } from "../__internal__/LazyActivityComponentType";

export function lazy<T extends { [K in keyof T]: any } = {}>(
  load: () => Promise<{ default: ActivityComponentType<T> }>,
): LazyActivityComponentType<T> {
  let cachedValue: { default: ActivityComponentType<T> } | null = null;

  const cachedLoad = async () => {
    if (!cachedValue) {
      const value = await load();
      cachedValue = value;
    }
    return cachedValue;
  };

  const DynamicComponent: LazyActivityComponentType<T> = React.lazy(cachedLoad);
  DynamicComponent._stackflow = { type: "lazy", load: cachedLoad };

  return DynamicComponent;
}

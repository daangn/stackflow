import React from "react";
import type { ActivityComponentType } from "../__internal__/ActivityComponentType";
import type { LazyActivityComponentType } from "../__internal__/LazyActivityComponentType";

export function lazy<T extends { [K in keyof T]: any } = {}>(
  load: () => Promise<{ default: ActivityComponentType<T> }>,
): LazyActivityComponentType<T> {
  const DynamicComponent: LazyActivityComponentType<T> = React.lazy(load);
  DynamicComponent._stackflow = { type: "lazy", load };

  return DynamicComponent;
}

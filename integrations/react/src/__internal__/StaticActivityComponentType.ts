import type React from "react";

export type StaticActivityComponentType<T extends {} = {}> =
  React.ComponentType<{ params: T }>;

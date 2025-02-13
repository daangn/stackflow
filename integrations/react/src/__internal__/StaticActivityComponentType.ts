import type React from "react";

export type StaticActivityComponentType<
  T extends { [K in keyof T]: any } = {},
> = React.ComponentType<{ params: T }>;

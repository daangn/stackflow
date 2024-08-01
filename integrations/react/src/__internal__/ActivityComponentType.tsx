import type React from "react";

export type ActivityComponentType<T extends { [K in keyof T]: any } = {}> =
  React.ComponentType<{ params: T }>;

import type { StaticActivityComponentType } from "./StaticActivityComponentType";
import type { ComponentType } from "react";

export type LazyActivityComponentType<T extends { [K in keyof T]: any } = {}> =
  ComponentType<{ params: T; shouldRenderImmediately?: boolean }> & {
    _load?: () => Promise<{ default: StaticActivityComponentType<T> }>;
  };

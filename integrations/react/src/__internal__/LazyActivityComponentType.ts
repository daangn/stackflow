import type { StaticActivityComponentType } from "./StaticActivityComponentType";

export type LazyActivityComponentType<T extends { [K in keyof T]: any } = {}> =
  React.ComponentType<{ params: T; shouldRenderImmediately?: boolean }> & {
    _load?: () => Promise<{ default: StaticActivityComponentType<T> }>;
  };

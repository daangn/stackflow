import type { StaticActivityComponentType } from "./StaticActivityComponentType";

export type LazyActivityComponentType<T extends { [K in keyof T]: any } = {}> =
  React.LazyExoticComponent<StaticActivityComponentType<T>> & {
    _load?: () => Promise<{ default: StaticActivityComponentType<T> }>;
  };

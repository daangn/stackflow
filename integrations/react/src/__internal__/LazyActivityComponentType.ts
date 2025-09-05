import type { StaticActivityComponentType } from "./StaticActivityComponentType";

export type LazyActivityComponentType<T extends {} = {}> =
  React.LazyExoticComponent<StaticActivityComponentType<T>> & {
    _load?: () => Promise<{ default: StaticActivityComponentType<T> }>;
  };

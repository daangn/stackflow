import type { StaticActivityComponentType } from "./BaseStaticActivityComponentType";

export type LazyActivityComponentType<T extends {} = {}> =
  StaticActivityComponentType<T> & {
    _load?: () => Promise<{ default: StaticActivityComponentType<T> }>;
  };

import type { StaticActivityComponentType } from "./StaticActivityComponentType";

export type LazyActivityComponentType<T extends {} = {}> =
  StaticActivityComponentType<T> & {
    _load?: () => Promise<{ default: StaticActivityComponentType<T> }>;
  };

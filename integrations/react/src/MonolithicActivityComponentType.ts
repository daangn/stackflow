import type { LazyActivityComponentType } from "./LazyActivityComponentType";
import type { StaticActivityComponentType } from "./BaseStaticActivityComponentType";

export type MonolithicActivityComponentType<T extends {} = {}> =
  | StaticActivityComponentType<T>
  | LazyActivityComponentType<T>;

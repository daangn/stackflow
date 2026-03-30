import type { LazyActivityComponentType } from "./LazyActivityComponentType";
import type { StaticActivityComponentType } from "./StaticActivityComponentType";

export type MonolithicActivityComponentType<T extends {} = {}> =
  | StaticActivityComponentType<T>
  | LazyActivityComponentType<T>;

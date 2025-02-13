import type { LazyActivityComponentType } from "./LazyActivityComponentType";
import type { StaticActivityComponentType } from "./StaticActivityComponentType";

export type ActivityComponentType<T extends { [K in keyof T]: any } = {}> =
  | StaticActivityComponentType<T>
  | LazyActivityComponentType<T>;

import type { LazyActivityComponentType } from "./LazyActivityComponentType";
import type { StaticActivityComponentType } from "./StaticActivityComponentType";

export type MonolithicActivityComponentType<T extends {} = {}> =
  | StaticActivityComponentType<T>
  | LazyActivityComponentType<T>;

export function isLazyActivityComponentType<T extends {}>(
  componentType: MonolithicActivityComponentType<T>,
): componentType is LazyActivityComponentType<T> {
  return "_load" in componentType;
}

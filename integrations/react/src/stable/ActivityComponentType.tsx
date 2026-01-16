import type { StaticActivityComponentType } from "../__internal__/StaticActivityComponentType";

export type ActivityComponentType<T extends {} = {}> =
  StaticActivityComponentType<T>;

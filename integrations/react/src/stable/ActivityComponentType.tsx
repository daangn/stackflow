import type { StaticActivityComponentType } from "../__internal__/StaticActivityComponentType";

export type ActivityComponentType<T extends { [K in keyof T]: any } = {}> =
  StaticActivityComponentType<T>;

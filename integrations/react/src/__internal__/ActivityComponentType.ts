import type { MonolithicActivityComponentType } from "./MonolithicActivityComponentType";
import type { StructuredActivityComponentType } from "./StructuredActivityComponentType";

export type ActivityComponentType<T extends { [K in keyof T]: any } = {}> =
  | MonolithicActivityComponentType<T>
  | StructuredActivityComponentType<T>;

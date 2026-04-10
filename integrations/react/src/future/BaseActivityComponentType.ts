import type { MonolithicActivityComponentType } from "./MonolithicActivityComponentType";
import type { StructuredActivityComponentType } from "./StructuredActivityComponentType";

export type ActivityComponentType<T extends {} = {}> =
  | MonolithicActivityComponentType<T>
  | StructuredActivityComponentType<T>;

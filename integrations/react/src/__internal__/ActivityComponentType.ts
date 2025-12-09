import type { MonolithicActivityComponentType } from "./MonolithicActivityComponentType";
import {
  isStructuredActivityComponent,
  type StructuredActivityComponentType,
} from "./StructuredActivityComponentType";

export type ActivityComponentType<T extends {} = {}> =
  | MonolithicActivityComponentType<T>
  | StructuredActivityComponentType<T>;

export function isMonolithicActivityComponentType<T extends {}>(
  componentType: ActivityComponentType<T>,
): componentType is MonolithicActivityComponentType<T> {
  return !isStructuredActivityComponent(componentType);
}

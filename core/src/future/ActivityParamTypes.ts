import type { ActivityDefinition } from "./ActivityDefinition";

export type ActivityParamTypes<T extends ActivityDefinition<any, any>> =
  T extends ActivityDefinition<any, infer P> ? P : never;

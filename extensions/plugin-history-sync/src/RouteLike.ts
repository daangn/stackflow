import type { ActivityComponentType } from "@stackflow/react";

export type Route<ComponentType> = {
  path: string;
  decode?: (
    params: Record<string, string>,
  ) => ComponentType extends ActivityComponentType<infer U> ? U : {};
};

export type RouteLike<ComponentType> =
  | string
  | string[]
  | Route<ComponentType>
  | Route<ComponentType>[];

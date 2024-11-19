import type { ActivityComponentType } from "@stackflow/react";

export type Route<K> = {
  path: string;
  priority?: number;
  decode?: (
    params: Record<string, string>,
  ) => K extends ActivityComponentType<infer U> ? U : {};
};

export type RouteLike<T> = string | string[] | Route<T> | Route<T>[];

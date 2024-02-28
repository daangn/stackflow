import type { ActivityComponentType } from "@stackflow/react";

export type Route<K> = {
  path: string;
  decode?: (params: Record<string, string>) => K extends
    | ActivityComponentType<infer U>
    | {
        component: ActivityComponentType<infer U>;
      }
    ? U
    : {};
};

export type RouteLike<T> = string | string[] | Route<T> | Route<T>[];

import type { ActivityComponentType as ReactActivityComponentType } from "@stackflow/react";
import type { ActivityComponentType as SolidActivityComponentType } from "@stackflow/solid";

export type Route<K> = {
  path: string;
  decode?: (
    params: Record<string, string>,
  ) => K extends ReactActivityComponentType<infer U>
    ? U
    : K extends SolidActivityComponentType<infer U>
      ? U
      : {};
};

export type RouteLike<T> = string | string[] | Route<T> | Route<T>[];

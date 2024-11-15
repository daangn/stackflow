import type { ActivityComponentType } from "@stackflow/react";

type Params<K> = K extends ActivityComponentType<infer U>
  ? U
  : Record<string, unknown>;

export type Route<K> = {
  path: string;
  decode?: (params: Record<string, string>) => Params<K> | null;
  encode?: (params: Params<K>) => Record<string, string>;
};

export type RouteLike<T> = string | string[] | Route<T> | Route<T>[];

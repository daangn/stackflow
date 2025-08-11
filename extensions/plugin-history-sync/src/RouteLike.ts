import type {
  RegisteredActivityName,
  RegisteredActivityParamTypes,
} from "@stackflow/config";
import type { ActivityComponentType } from "@stackflow/react";
import type { NonEmptyArray } from "./NonEmptyArray";

export type Route<ComponentType> = {
  path: string;
  decode?: (
    params: Record<string, string>,
  ) => ComponentType extends ActivityComponentType<infer U> ? U : {};
  defaultHistory?: NonEmptyArray<HistoryEntry>;
};

export type HistoryEntry = {
  [K in RegisteredActivityName]: {
    activityName: K;
    decode: (
      params: Record<string, string>,
    ) => NonEmptyArray<RegisteredActivityParamTypes[K]>;
  };
}[RegisteredActivityName];

export type RouteLike<ComponentType> =
  | string
  | string[]
  | Route<ComponentType>
  | Route<ComponentType>[];

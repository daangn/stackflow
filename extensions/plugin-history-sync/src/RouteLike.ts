import type {
  RegisteredActivityName,
  RegisteredActivityParamTypes,
} from "@stackflow/config";
import type { ActivityComponentType } from "@stackflow/react";

export type Route<ComponentType> = {
  path: string;
  decode?: (
    params: Record<string, string>,
  ) => ComponentType extends ActivityComponentType<infer U> ? U : {};
  defaultHistory?: (params: Record<string, string>) => HistoryEntry[];
};

export type HistoryEntry = {
  [K in RegisteredActivityName]: {
    activityName: K;
    activityParams: RegisteredActivityParamTypes[K];
    additionalSteps?: {
      stepParams: RegisteredActivityParamTypes[K];
      hasZIndex?: boolean;
    }[];
  };
}[RegisteredActivityName];

export type RouteLike<ComponentType> =
  | string
  | string[]
  | Route<ComponentType>
  | Route<ComponentType>[];

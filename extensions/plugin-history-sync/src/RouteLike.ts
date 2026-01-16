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
  defaultHistory?: (
    params: Record<string, string>,
  ) => HistoryEntry[] | DefaultHistoryDescriptor;
};

export type DefaultHistoryDescriptor = {
  entries: HistoryEntry[];
  skipDefaultHistorySetupTransition?: boolean;
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

export function interpretDefaultHistoryOption(
  option:
    | ((
        params: Record<string, string>,
      ) => HistoryEntry[] | DefaultHistoryDescriptor)
    | undefined,
  params: Record<string, string>,
): DefaultHistoryDescriptor {
  if (!option) return { entries: [] };

  const entriesOrDescriptor = option(params);

  if (Array.isArray(entriesOrDescriptor)) {
    return { entries: entriesOrDescriptor };
  }

  return entriesOrDescriptor;
}

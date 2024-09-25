import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";

export type Actions = {
  push<K extends RegisteredActivityName>(
    activityName: K,
    activityParams: InferActivityParams<K>,
    options?: {
      animate?: boolean;
    },
  ): {
    activityId: string;
  };
  replace<K extends RegisteredActivityName>(
    activityName: K,
    activityParams: InferActivityParams<K>,
    options?: {
      animate?: boolean;
      activityId?: string;
    },
  ): {
    activityId: string;
  };
  pop(): void;
  pop(options: { animate?: boolean }): void;
  pop(count: number, options?: { animate?: boolean }): void;
};

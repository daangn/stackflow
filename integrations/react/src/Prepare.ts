import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";

export type Prepare = <K extends RegisteredActivityName>(
  activityName: K,
  activityParams?: InferActivityParams<K>,
) => Promise<void>;

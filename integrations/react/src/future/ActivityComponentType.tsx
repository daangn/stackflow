import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ActivityComponentType as ActivityComponentTypeInternal } from "./BaseActivityComponentType";

export type ActivityComponentType<ActivityName extends RegisteredActivityName> =
  ActivityComponentTypeInternal<InferActivityParams<ActivityName>>;

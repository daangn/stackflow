import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { ActivityComponentType as ActivityComponentTypeInternal } from "../__internal__/ActivityComponentType";

export type ActivityComponentType<ActivityName extends RegisteredActivityName> =
  ActivityComponentTypeInternal<InferActivityParams<ActivityName>>;

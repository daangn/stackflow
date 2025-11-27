import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { StaticActivityComponentType as StaticActivityComponentTypeInternal } from "../__internal__/StaticActivityComponentType";

export type StaticActivityComponentType<
  ActivityName extends RegisteredActivityName,
> = StaticActivityComponentTypeInternal<InferActivityParams<ActivityName>>;

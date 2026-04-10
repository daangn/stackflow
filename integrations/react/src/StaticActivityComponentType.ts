import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { StaticActivityComponentType as StaticActivityComponentTypeInternal } from "./BaseStaticActivityComponentType";

export type StaticActivityComponentType<
  ActivityName extends RegisteredActivityName,
> = StaticActivityComponentTypeInternal<InferActivityParams<ActivityName>>;

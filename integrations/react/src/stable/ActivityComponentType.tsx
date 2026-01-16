import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { StaticActivityComponentType } from "../__internal__/StaticActivityComponentType";

export type ActivityComponentType<ActivityName extends RegisteredActivityName> =
  StaticActivityComponentType<InferActivityParams<ActivityName>>;

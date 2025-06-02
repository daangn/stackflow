import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { LazyActivityComponentType } from "../__internal__/LazyActivityComponentType";
import type { StaticActivityComponentType } from "../__internal__/StaticActivityComponentType";

export type ActivityComponentType<ActivityName extends RegisteredActivityName> =
  | StaticActivityComponentType<InferActivityParams<ActivityName>>
  | LazyActivityComponentType<InferActivityParams<ActivityName>>;

export type { StaticActivityComponentType, LazyActivityComponentType };

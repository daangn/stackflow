import type {
  InferActivityParams,
  RegisteredActivityName,
} from "@stackflow/config";
import type { MonolithicActivityComponentType } from "../__internal__/MonolithicActivityComponentType";
import type { StructuredActivityComponentType } from "../__internal__/StructuredActivityComponentType";

export type ActivityComponentType<ActivityName extends RegisteredActivityName> =
  | MonolithicActivityComponentType<InferActivityParams<ActivityName>>
  | StructuredActivityComponentType<InferActivityParams<ActivityName>>;

import type { ActivityBaseSchema } from "./ActivityBaseSchema";
import type { ActivityLoader } from "./ActivityLoader";
import type { InferActivityParams } from "./InferActivityParams";

export type ActivityDefinition<
  Name extends string,
  Schema extends ActivityBaseSchema,
> = {
  name: Name;
  path: string;
  schema?: Schema;
  loader?: ActivityLoader<
    InferActivityParams<ActivityDefinition<Name, Schema>>
  >;
};

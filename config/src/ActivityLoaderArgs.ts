import type { ActivityDefinition } from "./ActivityDefinition";
import type { Config } from "./Config";
import type { InferActivityParams } from "./InferActivityParams";
import type { RegisteredActivityName } from "./RegisteredActivityName";

export interface ActivityLoaderArgs<
  ActivityName extends RegisteredActivityName,
> {
  params: InferActivityParams<ActivityName>;
  config: Config<ActivityDefinition<RegisteredActivityName>>;
}

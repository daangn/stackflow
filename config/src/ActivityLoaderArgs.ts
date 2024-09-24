import type { ActivityDefinition } from "./ActivityDefinition";
import type { AllActivityName } from "./AllActivityName";
import type { Config } from "./Config";
import type { InferActivityParams } from "./InferActivityParams";

export interface ActivityLoaderArgs<ActivityName extends AllActivityName> {
  params: InferActivityParams<ActivityName>;
  config: Config<ActivityDefinition<AllActivityName>>;
}

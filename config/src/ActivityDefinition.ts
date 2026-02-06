import type { ActivityLoaderConfig } from "./ActivityLoader";
import type { RegisteredActivityName } from "./RegisteredActivityName";

export interface ActivityDefinition<
  ActivityName extends RegisteredActivityName,
> {
  name: ActivityName;
  loader?: ActivityLoaderConfig<any>;
}

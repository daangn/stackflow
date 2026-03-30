import type { ActivityLoader } from "./ActivityLoader";
import type { RegisteredActivityName } from "./RegisteredActivityName";

export interface ActivityDefinition<
  ActivityName extends RegisteredActivityName,
> {
  name: ActivityName;
  loader?: ActivityLoader<any>;
}

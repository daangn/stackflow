import type { ActivityLoader } from "./ActivityLoader";

export interface ActivityDefinition<ActivityName extends string> {
  name: ActivityName;
  loader?: ActivityLoader<any>;
}

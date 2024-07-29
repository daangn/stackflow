import type { ActivityLoader } from "./ActivityLoader";

export type ActivityDefinition<ActivityName extends string> = {
  name: ActivityName;
  path: string;
  loader?: ActivityLoader<any>;
};

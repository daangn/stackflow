import type { ActivityRegisteredEvent } from "@stackflow/core";

import type { ActivityComponentType } from "./activity";

export type BaseActivities = {
  [activityName: string]:
    | ActivityComponentType<any>
    | {
        component: ActivityComponentType<any>;
        paramsSchema: NonNullable<
          ActivityRegisteredEvent["activityParamsSchema"]
        >;
      };
};

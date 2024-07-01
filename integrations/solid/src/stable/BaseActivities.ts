import type { ActivityRegisteredEvent } from "@stackflow/core";

import type { ActivityComponentType } from "../__internal__/ActivityComponentType";

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

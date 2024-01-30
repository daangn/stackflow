import type { ActivityRegisteredEvent } from "@stackflow/core";

import type { ActivityComponentType } from "./activity";

export type BaseActivities = Record<
  string,
  | ActivityComponentType<any>
  | {
      component: ActivityComponentType<any>;
      paramsSchema: NonNullable<
        ActivityRegisteredEvent["activityParamsSchema"]
      >;
    }
>;

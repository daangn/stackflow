import type { ActivityRegisteredEvent } from "@stackflow/core";
import type { MonolithicActivityComponentType } from "../__internal__/MonolithicActivityComponentType";

export type BaseActivities = {
  [activityName: string]:
    | MonolithicActivityComponentType<any>
    | {
        component: MonolithicActivityComponentType<any>;
        paramsSchema: NonNullable<
          ActivityRegisteredEvent["activityParamsSchema"]
        >;
      };
};

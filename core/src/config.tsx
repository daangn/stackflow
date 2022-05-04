import React from "react";

import { ActivityComponentType, ParamsOf } from "./ActivityComponentType";
import { PluginType } from "./PluginType";

type ConfigOptionsActivitiesBase = {
  [activityName: string]:
    | ActivityComponentType<any>
    | {
        component: ActivityComponentType<any>;
      };
};

type ConfigOptions<Activities extends ConfigOptionsActivitiesBase> = {
  activities: Activities;
  plugins?: PluginType;
};

type ConfigOutput<Activities extends ConfigOptionsActivitiesBase> = {
  Stack: () => React.ReactNode;
  useFlow: () => {
    push: (
      activityName: keyof Activities,
      options: {
        params: ParamsOf<Activities[keyof Activities]>;
      }
    ) => void;
  };
};

export function config<Activities extends ConfigOptionsActivitiesBase>(
  input: ConfigOptions<Activities>
): ConfigOutput<Activities> {
  return {
    Stack: () => <div>Hello, Stack!</div>,
    useFlow: () => ({
      push(activityName, options) {},
    }),
  };
}

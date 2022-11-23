import React from "react";

import { ActivityProvider } from "./activity";
import type { BaseActivities } from "./BaseActivities";
import { useCoreState } from "./core";
import { usePlugins } from "./plugins";
import { StackProvider } from "./stack";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import type { WithRequired } from "./utils";

interface PluginRendererProps {
  activities: BaseActivities;
  plugin: WithRequired<ReturnType<StackflowReactPlugin>, "render">;
}
const PluginRenderer: React.FC<PluginRendererProps> = ({
  activities,
  plugin,
}) => {
  const coreState = useCoreState();
  const plugins = usePlugins();

  return plugin.render({
    stack: {
      ...coreState,
      render(overrideStack) {
        const stack = {
          ...coreState,
          ...overrideStack,
        };

        return {
          activities: stack.activities.map((activity) => ({
            ...activity,
            key: activity.id,
            render(overrideActivity) {
              const Activity = activities[activity.name];
              let output: React.ReactNode;

              if ("component" in Activity) {
                const { component: ActivityComponent } = Activity;
                output = <ActivityComponent params={activity.params} />;
              } else {
                output = <Activity params={activity.params} />;
              }

              plugins.forEach((p) => {
                output =
                  p.wrapActivity?.({
                    activity: {
                      ...activity,
                      render: () => output,
                    },
                  }) ?? output;
              });

              return (
                <StackProvider value={stack}>
                  <ActivityProvider
                    key={activity.id}
                    value={{
                      ...activity,
                      ...overrideActivity,
                    }}
                  >
                    {output}
                  </ActivityProvider>
                </StackProvider>
              );
            },
          })),
        };
      },
    },
  });
};

export default PluginRenderer;

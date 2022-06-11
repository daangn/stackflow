import React from "react";

import { ActivityProvider } from "./activity";
import { usePlugins } from "./plugins/usePlugins";
import { useStack } from "./stack";
import { StackflowReactPlugin } from "./StackflowReactPlugin";
import { WithRequired } from "./utils";

interface PluginRendererProps {
  activities: { [key: string]: React.ComponentType };
  plugin: WithRequired<ReturnType<StackflowReactPlugin>, "render">;
}
const PluginRenderer: React.FC<PluginRendererProps> = ({
  activities,
  plugin,
}) => {
  const stack = useStack();
  const plugins = usePlugins();

  return plugin.render({
    stack: {
      ...stack,
      render(overrideStack) {
        return {
          activities: stack.activities.map((activity) => ({
            ...activity,
            key: activity.id,
            render(overrideActivity) {
              const ActivityComponent = activities[activity.name];

              let output = <ActivityComponent {...activity.params} />;

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
                <ActivityProvider
                  key={activity.id}
                  value={{
                    ...activity,
                    ...overrideActivity,
                  }}
                >
                  {output}
                </ActivityProvider>
              );
            },
          })),
        };
      },
    },
  });
};

export default PluginRenderer;

import React from "react";

import { ActivityProvider } from "./activity";
import { usePlugins } from "./plugins/usePlugins";
import { useStack } from "./stack";
import { StackflowReactPlugin } from "./StackflowReactPlugin";
import { WithRequired } from "./utils";

interface PluginRendererProps {
  activities: { [key: string]: React.ComponentType };
  plugin: WithRequired<ReturnType<StackflowReactPlugin>, "renderStack">;
}
const PluginRenderer: React.FC<PluginRendererProps> = ({
  activities,
  plugin,
}) => {
  const stack = useStack();
  const plugins = usePlugins();

  return plugin.renderStack({
    stack: {
      activities: stack.activities.map((activity) => ({
        ...activity,
        key: activity.id,
        render(overrideActivity) {
          const ActivityComponent = activities[activity.name];

          const overridenActivity = {
            ...activity,
            ...overrideActivity,
          };

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
            <ActivityProvider key={activity.id} value={overridenActivity}>
              {output}
            </ActivityProvider>
          );
        },
      })),
    },
  });
};

export default PluginRenderer;

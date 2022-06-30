import React from "react";

import { ActivityProvider } from "./activity";
import { useCoreState } from "./core";
import { usePlugins } from "./plugins";
import { StackProvider } from "./stack";
import { StackflowReactPlugin } from "./StackflowReactPlugin";
import { WithRequired } from "./utils";

interface PluginRendererProps {
  activities: { [key: string]: React.ComponentType };
  plugin: WithRequired<ReturnType<StackflowReactPlugin<{}>>, "render">;
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

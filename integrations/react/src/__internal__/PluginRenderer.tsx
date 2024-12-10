import type React from "react";
import type { ActivityComponentType } from "./ActivityComponentType";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import { ActivityProvider } from "./activity";
import { useCoreState } from "./core";
import { usePlugins } from "./plugins";
import type { WithRequired } from "./utils";

interface PluginRendererProps {
  activityComponentMap: {
    [key: string]: ActivityComponentType;
  };
  plugin: WithRequired<ReturnType<StackflowReactPlugin>, "render">;
  initialContext: any;
}
const PluginRenderer: React.FC<PluginRendererProps> = ({
  activityComponentMap,
  plugin,
  initialContext,
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
              const Activity = activityComponentMap[activity.name];

              let output: React.ReactNode = (
                <Activity params={activity.params} />
              );

              plugins.forEach((p) => {
                output =
                  p.wrapActivity?.({
                    activity: {
                      ...activity,
                      render: () => output,
                    },
                    initialContext,
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
    initialContext,
  });
};

PluginRenderer.displayName = "PluginRenderer";

export default PluginRenderer;

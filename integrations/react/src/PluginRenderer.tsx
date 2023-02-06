import type { ActivityComponentType } from "./activity";
import { ActivityProvider } from "./activity";
import { useCoreState } from "./core";
import { usePlugins } from "./plugins";
import { StackProvider } from "./stack";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import type { WithRequired } from "./utils";

interface PluginRendererProps {
  activityComponentMap: {
    [key: string]: ActivityComponentType;
  };
  plugin: WithRequired<ReturnType<StackflowReactPlugin>, "render">;
}
const PluginRenderer: React.FC<PluginRendererProps> = ({
  activityComponentMap,
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

PluginRenderer.displayName = "PluginRenderer";

export default PluginRenderer;

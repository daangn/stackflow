import type { Activity, Stack } from "@stackflow/core";
import type { Accessor, Component, JSXElement } from "solid-js";
import { mapArray, mergeProps } from "solid-js";

import type { ActivityComponentType } from "./ActivityComponentType";
import type { StackflowSolidPlugin } from "./StackflowSolidPlugin";
import { ActivityProvider } from "./activity";
import { useCoreState } from "./core";
import { usePlugins } from "./plugins";
import { StackProvider } from "./stack";
import type { WithRequired } from "./utils";

type PluginRenderProps = Parameters<
  NonNullable<ReturnType<StackflowSolidPlugin>["render"]>
>[0];

export function createPluginRenderProps({
  activityComponentMap,
  initialContext,
}: {
  activityComponentMap: {
    [key: string]: ActivityComponentType;
  };
  initialContext: Accessor<any>;
}): PluginRenderProps {
  const { stack } = useCoreState();
  const plugins = usePlugins();
  const activities = new Map<
    string,
    Activity & { render: (overrideActivity?: Partial<Activity>) => JSXElement }
  >();

  return {
    stack: mergeProps(stack, {
      render(overrideStack?: Partial<Stack>) {
        const stackWithOverrides = mergeProps(stack, overrideStack);

        return {
          activities: mapArray(
            () => stackWithOverrides.activities,
            (activity) => {
              if (activities.has(activity.id))
                return activities.get(activity.id)!;

              const activityWithRender = mergeProps(activity, {
                render(overrideActivity?: Partial<Activity>) {
                  const Activity = activityComponentMap[activity.name];
                  const render = plugins.reduce(
                    (render, p) => {
                      if (!p.wrapActivity) {
                        return render;
                      }

                      return () =>
                        p.wrapActivity?.({
                          activity: mergeProps(activity, { render }),
                          initialContext,
                        });
                    },
                    () => <Activity params={activity.params} />,
                  );

                  return (
                    <StackProvider value={stackWithOverrides}>
                      <ActivityProvider
                        value={mergeProps(activity, overrideActivity)}
                      >
                        {render()}
                      </ActivityProvider>
                    </StackProvider>
                  );
                },
              });
              activities.set(activity.id, activityWithRender);
              return activityWithRender;
            },
          ),
        };
      },
    }),
    initialContext,
  };
}

interface PluginRendererProps {
  plugin: WithRequired<ReturnType<StackflowSolidPlugin>, "render">;
  renderProps: PluginRenderProps;
}
const PluginRenderer: Component<PluginRendererProps> = (props) =>
  props.plugin.render(props.renderProps);

export default PluginRenderer;

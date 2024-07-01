import type { Component } from "solid-js";
import { mergeProps } from "solid-js";

import type { ActivityComponentType } from "./ActivityComponentType";
import PluginRenderer, { createPluginRenderProps } from "./PluginRenderer";
import { useCoreState } from "./core";
import { usePlugins } from "./plugins";
import { StackProvider } from "./stack";
import type { WithRequired } from "./utils";

interface MainRendererProps {
  activityComponentMap: {
    [key: string]: ActivityComponentType;
  };
  initialContext: any;
}
const MainRenderer: Component<MainRendererProps> = (props) => {
  const { stack } = useCoreState();
  const plugins = usePlugins();

  const renderingPlugins = plugins.filter(
    (plugin): plugin is WithRequired<typeof plugin, "render"> =>
      !!plugin.render,
  );

  if (renderingPlugins.length === 0) {
    console.warn(
      "Stackflow -" +
        ` There is no rendering plugin, so "<Stack />" doesn't render anything.` +
        ` If you want to render some UI, use "@stackflow/plugin-renderer-basic"` +
        " or add another rendering plugin.",
    );
  }

  const pluginRenderProps = createPluginRenderProps({
    activityComponentMap: props.activityComponentMap,
    initialContext: () => props.initialContext,
  });

  const render = plugins.reduce(
    (render, p) => {
      if (!p.wrapStack) {
        return render;
      }

      return () =>
        p.wrapStack?.({
          stack: mergeProps(stack, { render }),
          initialContext: () => props.initialContext,
        });
    },
    () => (
      <>
        {renderingPlugins.map((plugin) => (
          <PluginRenderer plugin={plugin} renderProps={pluginRenderProps} />
        ))}
      </>
    ),
  );

  return <StackProvider value={stack}>{render()}</StackProvider>;
};

export default MainRenderer;

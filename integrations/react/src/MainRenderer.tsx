import React from "react";

import { useCore } from "./core";
import PluginRenderer from "./PluginRenderer";
import { usePlugins } from "./plugins";
import { WithRequired } from "./utils";

interface MainRendererProps {
  activities: { [key: string]: React.ComponentType };
}
const MainRenderer: React.FC<MainRendererProps> = ({ activities }) => {
  const core = useCore();
  const plugins = usePlugins();

  let output = (
    <>
      {plugins
        .filter(
          (plugin): plugin is WithRequired<typeof plugin, "render"> =>
            !!plugin.render,
        )
        .map((plugin) => (
          <PluginRenderer
            activities={activities}
            key={plugin.key}
            plugin={plugin}
          />
        ))}
    </>
  );

  plugins.forEach((plugin) => {
    output =
      plugin.wrapStack?.({
        stack: {
          ...core.state,
          render() {
            return output;
          },
        },
      }) ?? output;
  });

  return output;
};

export default MainRenderer;

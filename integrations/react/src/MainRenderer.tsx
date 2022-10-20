import React, { useEffect } from "react";

import type { BaseActivities } from "./BaseActivities";
import { useCoreState } from "./core";
import PluginRenderer from "./PluginRenderer";
import { usePlugins } from "./plugins";
import type { WithRequired } from "./utils";

interface MainRendererProps {
  activities: BaseActivities;
}
const MainRenderer: React.FC<MainRendererProps> = ({ activities }) => {
  const coreState = useCoreState();
  const plugins = usePlugins();

  const renderPlugins = plugins.filter(
    (plugin): plugin is WithRequired<typeof plugin, "render"> =>
      !!plugin.render,
  );

  useEffect(() => {
    if (renderPlugins.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `Stackflow -` +
          ` There is no rendering plugin, so "<Stack />" doesn't render anything.` +
          ` If you want to render some UI, use "@stackflow/plugin-renderer-basic"` +
          ` or add another rendering plugin.`,
      );
    }
  }, [renderPlugins]);

  let output = (
    <>
      {renderPlugins.map((plugin) => (
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
          ...coreState,
          render() {
            return output;
          },
        },
      }) ?? output;
  });

  return output;
};

export default MainRenderer;
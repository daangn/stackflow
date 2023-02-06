import { useEffect } from "react";

import type { ActivityComponentType } from "./activity";
import { useCoreState } from "./core";
import PluginRenderer from "./PluginRenderer";
import { usePlugins } from "./plugins";
import type { WithRequired } from "./utils";

interface MainRendererProps {
  activityComponentMap: {
    [key: string]: ActivityComponentType;
  };
}
const MainRenderer: React.FC<MainRendererProps> = ({
  activityComponentMap,
}) => {
  const coreState = useCoreState();
  const plugins = usePlugins();

  const renderingPlugins = plugins.filter(
    (plugin): plugin is WithRequired<typeof plugin, "render"> =>
      !!plugin.render,
  );

  useEffect(() => {
    if (renderingPlugins.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `Stackflow -` +
          ` There is no rendering plugin, so "<Stack />" doesn't render anything.` +
          ` If you want to render some UI, use "@stackflow/plugin-renderer-basic"` +
          ` or add another rendering plugin.`,
      );
    }
  }, [renderingPlugins]);

  let output = (
    <>
      {renderingPlugins.map((plugin) => (
        <PluginRenderer
          key={plugin.key}
          activityComponentMap={activityComponentMap}
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

MainRenderer.displayName = "MainRenderer";

export default MainRenderer;

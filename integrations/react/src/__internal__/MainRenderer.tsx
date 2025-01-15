import { useEffect } from "react";
import type { ActivityComponentType } from "./ActivityComponentType";
import PluginRenderer from "./PluginRenderer";
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
const MainRenderer: React.FC<MainRendererProps> = ({
  activityComponentMap,
  initialContext,
}) => {
  const coreState = useCoreState();
  const plugins = usePlugins();

  const renderingPlugins = plugins.filter(
    (plugin): plugin is WithRequired<typeof plugin, "render"> =>
      !!plugin.render,
  );

  useEffect(() => {
    if (renderingPlugins.length === 0) {
      console.warn(
        "Stackflow -" +
          ` There is no rendering plugin, so "<Stack />" doesn't render anything.` +
          ` If you want to render some UI, use "@stackflow/plugin-renderer-basic"` +
          " or add another rendering plugin.",
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
          initialContext={initialContext}
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
        initialContext,
      }) ?? output;
  });

  return <StackProvider value={coreState}>{output}</StackProvider>;
};

MainRenderer.displayName = "MainRenderer";

export default MainRenderer;

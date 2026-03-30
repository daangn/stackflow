import React, { Component, type ReactNode, Suspense } from "react";
import { useActivityComponentMap } from "./ActivityComponentMapProvider";
import { ActivityProvider } from "./activity";
import { useCoreState } from "./core";
import { usePlugins } from "./plugins";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import {
  getContentComponent,
  isStructuredActivityComponent,
  type StructuredActivityComponentType,
} from "./StructuredActivityComponentType";
import type { WithRequired } from "./utils";

interface PluginRendererProps {
  plugin: WithRequired<ReturnType<StackflowReactPlugin>, "render">;
  initialContext: any;
}
const PluginRenderer: React.FC<PluginRendererProps> = ({
  plugin,
  initialContext,
}) => {
  const activityComponentMap = useActivityComponentMap();
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

              let output: React.ReactNode = isStructuredActivityComponent(
                Activity,
              ) ? (
                renderStructuredActivityComponent(Activity, activity.params)
              ) : (
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

function renderStructuredActivityComponent(
  structuredActivityComponent: StructuredActivityComponentType<{}>,
  params: {},
): ReactNode {
  const { layout, loading, errorHandler } = structuredActivityComponent;
  const { Component: ContentComponent } = getContentComponent(
    structuredActivityComponent,
  );

  const wrappers: Array<(node: ReactNode) => ReactNode> = [
    (node) =>
      loading?.component ? (
        <Suspense fallback={<loading.component params={params} />}>
          {node}
        </Suspense>
      ) : (
        node
      ),
    (node) => {
      if (!errorHandler) return node;

      const ErrorBoundary =
        errorHandler.boundary ?? StructuredActivityComponentErrorBoundary;

      return (
        <ErrorBoundary
          renderFallback={(err, reset) => (
            <errorHandler.component params={params} error={err} reset={reset} />
          )}
        >
          {node}
        </ErrorBoundary>
      );
    },
    (node) =>
      layout?.component ? (
        <layout.component params={params}>{node}</layout.component>
      ) : (
        node
      ),
  ];

  return wrappers.reduce<ReactNode>(
    (node, wrapper) => wrapper(node),
    <ContentComponent params={params} />,
  );
}

class StructuredActivityComponentErrorBoundary extends Component<
  {
    children: ReactNode;
    renderFallback: (error: unknown, reset: () => void) => ReactNode;
  },
  {
    hasError: boolean;
    error: unknown;
  }
> {
  state = {
    hasError: false,
    error: null,
  };

  reset = () => this.setState({ hasError: false, error: null });

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.renderFallback(this.state.error, this.reset);
    }

    return this.props.children;
  }

  static getDerivedStateFromError(error: unknown): {
    hasError: true;
    error: unknown;
  } {
    return { hasError: true, error };
  }
}

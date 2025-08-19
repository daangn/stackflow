import React, { Component, type ReactNode, Suspense } from "react";
import { useActivityComponentMap } from "./ActivityComponentMapProvider";
import { ActivityProvider } from "./activity";
import { useCoreState } from "./core";
import { usePlugins } from "./plugins";
import type { StackflowReactPlugin } from "./StackflowReactPlugin";
import type { StructuredActivityComponentType } from "./StructuredActivityComponentType";
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

              let output: React.ReactNode =
                typeof Activity === "function" ? (
                  <Activity params={activity.params} />
                ) : (
                  renderStructuredActivityComponent(Activity, activity.params)
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

function renderStructuredActivityComponent<P extends {}>(
  structuredActivityComponent: StructuredActivityComponentType<P>,
  params: P,
): ReactNode {
  const {
    content: Content,
    layout: Layout,
    loading: Loading,
    error: ErrorComponent,
  } = structuredActivityComponent;

  const wrappers: Array<(node: ReactNode) => ReactNode> = [
    (node) =>
      ErrorComponent ? (
        <StructuredActivityComponentErrorBoundary
          renderFallback={(err, reset) => (
            <ErrorComponent params={params} error={err} reset={reset} />
          )}
        >
          {node}
        </StructuredActivityComponentErrorBoundary>
      ) : (
        node
      ),
    (node) =>
      Loading ? (
        <Suspense fallback={<Loading params={params} />}>{node}</Suspense>
      ) : (
        node
      ),
    (node) => (Layout ? <Layout params={params}>{node}</Layout> : node),
  ];

  return wrappers.reduce<ReactNode>(
    (node, wrapper) => wrapper(node),
    <Content params={params} />,
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

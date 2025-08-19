import {
  Component,
  type ComponentType,
  Fragment,
  type ReactNode,
  Suspense,
} from "react";
import type { MonolithicActivityComponentType } from "./MonolithicActivityComponentType";

export interface StructuredActivityComponentType<P extends {}> {
  content: MonolithicActivityComponentType<P>;
  layout?: ComponentType<{ params: P; children: ReactNode }>;
  loading?: ComponentType<{ params: P }>;
  error?: ComponentType<{ params: P; error: unknown; reset: () => void }>;
}

export function renderStructuredActivityComponent<P extends {}>(
  component: StructuredActivityComponentType<P>,
  params: P,
): ReactNode {
  const Layout = component.layout ?? Fragment;
  const Loading = component.loading ?? Fragment;
  const ErrorBoundary = component.error
    ? StructuredActivityComponentErrorBoundary
    : Fragment;
  const Content = component.content;

  return (
    <Layout params={params}>
      <ErrorBoundary
        renderFallback={(error, reset) =>
          component.error && (
            <component.error params={params} error={error} reset={reset} />
          )
        }
      >
        <Suspense fallback={<Loading params={params} />}>
          <Content params={params} />
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

class StructuredActivityComponentErrorBoundary extends Component<{
  children: ReactNode;
  renderFallback: (error: unknown, reset: () => void) => ReactNode;
}> {
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

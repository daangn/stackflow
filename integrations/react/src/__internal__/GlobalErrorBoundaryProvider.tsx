import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react";

/**
 * Wrapper 형태의 전역 ErrorBoundary 컴포넌트 타입
 * Sentry.ErrorBoundary 등과 호환됩니다.
 */
export type GlobalErrorBoundaryComponent = ComponentType<{
  children: ReactNode;
}>;

export interface GlobalErrorBoundaryConfig {
  /**
   * 전역 ErrorBoundary로 사용할 컴포넌트
   * children을 감싸는 wrapper 형태여야 합니다.
   * 예: Sentry.ErrorBoundary, 커스텀 ErrorBoundary 등
   */
  component: GlobalErrorBoundaryComponent;
}

const GlobalErrorBoundaryContext =
  createContext<GlobalErrorBoundaryConfig | null>(null);

export function useGlobalErrorBoundary(): GlobalErrorBoundaryConfig | null {
  return useContext(GlobalErrorBoundaryContext);
}

interface GlobalErrorBoundaryProviderProps {
  children: ReactNode;
  value: GlobalErrorBoundaryConfig | null;
}

export function GlobalErrorBoundaryProvider({
  children,
  value,
}: GlobalErrorBoundaryProviderProps) {
  return (
    <GlobalErrorBoundaryContext.Provider value={value}>
      {children}
    </GlobalErrorBoundaryContext.Provider>
  );
}

GlobalErrorBoundaryProvider.displayName = "GlobalErrorBoundaryProvider";

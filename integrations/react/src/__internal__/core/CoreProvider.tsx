import type { CoreStore, Stack } from "@stackflow/core";
import { createContext } from "react";

export const CoreActionsContext = createContext<CoreStore["actions"]>(
  null as any,
);
export const CoreStateContext = createContext<Stack>(null as any);

export interface CoreProviderProps {
  coreStore: CoreStore;
  coreState: Stack;
  children: React.ReactNode;
}
export const CoreProvider: React.FC<CoreProviderProps> = ({
  coreStore,
  coreState,
  children,
}) => {
  return (
    <CoreStateContext.Provider value={coreState}>
      <CoreActionsContext.Provider value={coreStore.actions}>
        {children}
      </CoreActionsContext.Provider>
    </CoreStateContext.Provider>
  );
};

CoreProvider.displayName = "CoreProvider";

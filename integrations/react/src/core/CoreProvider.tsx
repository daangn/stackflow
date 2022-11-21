import type { AggregateOutput, CreateCoreStoreOutput } from "@stackflow/core";
import React, { createContext, useSyncExternalStore } from "react";

export const CoreActionsContext = createContext<
  CreateCoreStoreOutput["actions"]
>(null as any);
export const CoreStateContext = createContext<AggregateOutput>(null as any);

export interface CoreProviderProps {
  coreStore: CreateCoreStoreOutput;
  children: React.ReactNode;
}
export const CoreProvider: React.FC<CoreProviderProps> = ({
  coreStore,
  children,
}) => {
  const state = useSyncExternalStore(
    coreStore.subscribe,
    coreStore.actions.getStack,
    coreStore.actions.getStack,
  );

  return (
    <CoreStateContext.Provider value={state}>
      <CoreActionsContext.Provider value={coreStore.actions}>
        {children}
      </CoreActionsContext.Provider>
    </CoreStateContext.Provider>
  );
};

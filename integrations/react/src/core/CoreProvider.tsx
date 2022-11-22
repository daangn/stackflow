import type { AggregateOutput, CreateCoreStoreOutput } from "@stackflow/core";
import React, { createContext } from "react";

import { useDeferredValue, useSyncExternalStore } from "../shims";

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
  const stack = useSyncExternalStore(
    coreStore.subscribe,
    coreStore.actions.getStack,
    coreStore.actions.getStack,
  );

  const deferredStack = useDeferredValue(stack);

  return (
    <CoreStateContext.Provider value={deferredStack}>
      <CoreActionsContext.Provider value={coreStore.actions}>
        {children}
      </CoreActionsContext.Provider>
    </CoreStateContext.Provider>
  );
};

import type { CreateCoreStoreOutput } from "@stackflow/core";
import React, { useSyncExternalStore } from "react";

import { CoreActionsContext } from "./CoreActionsContext";
import { CoreStateContext } from "./CoreStateContext";

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
    coreStore.coreActions.getStack,
  );

  return (
    <CoreStateContext.Provider value={state}>
      <CoreActionsContext.Provider value={coreStore.coreActions}>
        {children}
      </CoreActionsContext.Provider>
    </CoreStateContext.Provider>
  );
};

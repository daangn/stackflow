import type { CoreStore, Stack } from "@stackflow/core";
import { createContext } from "react";

import { useDeferredValue, useSyncExternalStore } from "../shims";

export const UNSAFE_CoreActionsContext = createContext<CoreStore["actions"]>(
  null as any,
);
export const UNSAFE_CoreStateContext = createContext<Stack>(null as any);

export interface CoreProviderProps {
  coreStore: CoreStore;
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
    <UNSAFE_CoreStateContext.Provider value={deferredStack}>
      <UNSAFE_CoreActionsContext.Provider value={coreStore.actions}>
        {children}
      </UNSAFE_CoreActionsContext.Provider>
    </UNSAFE_CoreStateContext.Provider>
  );
};

CoreProvider.displayName = "CoreProvider";

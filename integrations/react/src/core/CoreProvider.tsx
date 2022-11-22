import type { AggregateOutput, CreateCoreStoreOutput } from "@stackflow/core";
import React, { createContext, useEffect, useState } from "react";

export const CoreActionsContext = createContext<
  CreateCoreStoreOutput["actions"]
>(null as any);
export const CoreStateContext = createContext<AggregateOutput>(null as any);

const startTransition: React.TransitionStartFunction =
  React.startTransition ?? ((cb: () => void) => cb());

export interface CoreProviderProps {
  coreStore: CreateCoreStoreOutput;
  children: React.ReactNode;
}
export const CoreProvider: React.FC<CoreProviderProps> = ({
  coreStore,
  children,
}) => {
  const [state, setState] = useState(() => coreStore.actions.getStack());

  useEffect(
    () =>
      coreStore.subscribe(() => {
        startTransition(() => {
          setState(coreStore.actions.getStack());
        });
      }),
    [],
  );

  return (
    <CoreStateContext.Provider value={state}>
      <CoreActionsContext.Provider value={coreStore.actions}>
        {children}
      </CoreActionsContext.Provider>
    </CoreStateContext.Provider>
  );
};

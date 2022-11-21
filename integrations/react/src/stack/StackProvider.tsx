import type { AggregateOutput } from "@stackflow/core";
import React, { createContext } from "react";

import { useMemoDeep } from "../utils";

export const StackContext = createContext<AggregateOutput>(null as any);

interface StackProviderProps {
  children: React.ReactNode;
  value: AggregateOutput;
}
export const StackProvider: React.FC<StackProviderProps> = ({
  children,
  value,
}) => (
  <StackContext.Provider value={useMemoDeep(value)}>
    {children}
  </StackContext.Provider>
);

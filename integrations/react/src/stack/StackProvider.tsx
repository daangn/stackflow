import type { Stack } from "@stackflow/core";
import { createContext } from "react";

import { useMemoDeep } from "../utils";

export const StackContext = createContext<Stack>(null as any);

interface StackProviderProps {
  children: React.ReactNode;
  value: Stack;
}
export const StackProvider = ({ children, value }: StackProviderProps) => (
  <StackContext.Provider value={useMemoDeep(value)}>
    {children}
  </StackContext.Provider>
);

StackProvider.displayName = "StackProvider";

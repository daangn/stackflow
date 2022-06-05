import React from "react";

import { StackContextContext } from "./StackContextContext";

interface StackContextProviderProps {
  context: any;
  children: React.ReactNode;
}
export const StackContextProvider: React.FC<StackContextProviderProps> = ({
  context,
  children,
}) => (
  <StackContextContext.Provider value={context}>
    {children}
  </StackContextContext.Provider>
);

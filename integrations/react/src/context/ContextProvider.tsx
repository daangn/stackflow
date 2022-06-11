import React from "react";

import { ContextContext } from "./ContextContext";

interface ContextProviderProps {
  children: React.ReactNode;
  value: any;
}
export const ContextProvider: React.FC<ContextProviderProps> = ({
  children,
  value,
}) => (
  <ContextContext.Provider value={value}>{children}</ContextContext.Provider>
);

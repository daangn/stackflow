import React from "react";

import { InitContextContext } from "./InitContextContext";

interface InitContextProviderProps {
  children: React.ReactNode;
  value: any;
}
export const InitContextProvider: React.FC<InitContextProviderProps> = ({
  children,
  value,
}) => (
  <InitContextContext.Provider value={value}>
    {children}
  </InitContextContext.Provider>
);

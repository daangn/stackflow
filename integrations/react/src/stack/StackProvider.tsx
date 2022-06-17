import { AggregateOutput } from "@stackflow/core";
import React from "react";

import { useMemoDeep } from "../utils";
import { StackContext } from "./StackContext";

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

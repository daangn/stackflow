import React from "react";

import type { PluginsContextValue } from "./PluginsContext";
import { PluginsContext } from "./PluginsContext";

interface PluginsProviderProps {
  children: React.ReactNode;
  value: PluginsContextValue;
}
export const PluginsProvider: React.FC<PluginsProviderProps> = ({
  children,
  value,
}) => (
  <PluginsContext.Provider value={value}>{children}</PluginsContext.Provider>
);

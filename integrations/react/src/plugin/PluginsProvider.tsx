import React, { useMemo } from "react";

import { PluginsContext, PluginsContextValue } from "./PluginsContext";

interface PluginsProviderProps {
  plugins: PluginsContextValue;
  children: React.ReactNode;
}
export const PluginsProvider: React.FC<PluginsProviderProps> = ({
  plugins,
  children,
}) => (
  <PluginsContext.Provider value={plugins}>{children}</PluginsContext.Provider>
);

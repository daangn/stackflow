import { useContext } from "react";

import { PluginsContext } from "./PluginsContext";

export function usePlugins() {
  return useContext(PluginsContext);
}

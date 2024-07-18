import { useContext } from "react";

import { PluginsContext } from "./PluginsProvider";

export function usePlugins() {
  return useContext(PluginsContext);
}

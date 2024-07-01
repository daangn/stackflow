import { useContext } from "solid-js";

import { PluginsContext } from "./PluginsProvider";

export function usePlugins() {
  const plugins = useContext(PluginsContext);

  if (!plugins) {
    throw new Error("usePlugins() must be used within a <PluginsProvider />");
  }

  return plugins;
}

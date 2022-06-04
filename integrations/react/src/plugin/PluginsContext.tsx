import { createContext } from "react";

import { StackflowPlugin } from "./StackflowPlugin";

export interface PluginsContextValue {
  plugins: Array<ReturnType<StackflowPlugin>>;
}
export const PluginsContext = createContext<PluginsContextValue>(null as any);

import { createContext } from "react";

import { StackflowPlugin } from "./StackflowPlugin";

export type PluginsContextValue = Array<ReturnType<StackflowPlugin>>;
export const PluginsContext = createContext<PluginsContextValue>(null as any);

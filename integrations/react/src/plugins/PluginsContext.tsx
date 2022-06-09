import { createContext } from "react";

import { StackflowReactPlugin } from "../StackflowReactPlugin";

export type PluginsContextValue = Array<ReturnType<StackflowReactPlugin>>;
export const PluginsContext = createContext<PluginsContextValue>(null as any);

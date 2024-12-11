import type { Component, JSXElement } from "solid-js";
import { createContext } from "solid-js";

import type { StackflowSolidPlugin } from "../StackflowSolidPlugin";

export type PluginsContextValue = Array<ReturnType<StackflowSolidPlugin>>;
export const PluginsContext = createContext<PluginsContextValue>(null as any);

interface PluginsProviderProps {
  children: JSXElement;
  value: PluginsContextValue;
}
export const PluginsProvider: Component<PluginsProviderProps> = (props) => (
  <PluginsContext.Provider value={props.value}>
    {props.children}
  </PluginsContext.Provider>
);

import type { Stack } from "@stackflow/core";
import type { Accessor, Component, JSXElement } from "solid-js";
import { createContext } from "solid-js";

export const StackContext = createContext<Accessor<Stack>>(null as any);

interface StackProviderProps {
  children: JSXElement;
  value: Stack;
}
export const StackProvider: Component<StackProviderProps> = (props) => (
  <StackContext.Provider value={() => props.value}>
    {props.children}
  </StackContext.Provider>
);

import type { Activity } from "@stackflow/core";
import type { Accessor, Component, JSXElement } from "solid-js";
import { createContext } from "solid-js";

export const ActivityContext = createContext<Accessor<Activity | undefined>>(
  () => undefined,
);

interface ActivityProviderProps {
  children: JSXElement;
  value: Activity;
}
export const ActivityProvider: Component<ActivityProviderProps> = (props) => (
  <ActivityContext.Provider value={() => props.value}>
    {props.children}
  </ActivityContext.Provider>
);

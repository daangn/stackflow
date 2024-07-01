/* @jsxImportSource solid-js */

import type { JSXElement } from "solid-js";
import { createContext, useContext } from "solid-js";

import type { ActivityRoute } from "../common/ActivityRoute";

export const RoutesContext = createContext<ActivityRoute<unknown>[]>([]);

interface RoutesProviderProps<T> {
  routes: ActivityRoute<T>[];
  children: JSXElement;
}
export const RoutesProvider = <T,>(props: RoutesProviderProps<T>) => (
  <RoutesContext.Provider value={props.routes}>
    {props.children}
  </RoutesContext.Provider>
);

export function useRoutes() {
  return useContext(RoutesContext);
}

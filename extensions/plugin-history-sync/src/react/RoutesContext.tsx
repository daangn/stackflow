import { createContext, useContext } from "react";

import type { ActivityRoute } from "../common/ActivityRoute";

export const RoutesContext = createContext<ActivityRoute<unknown>[]>([]);

interface RoutesProviderProps<T> {
  routes: ActivityRoute<T>[];
  children: React.ReactNode;
}
export const RoutesProvider = <T,>(props: RoutesProviderProps<T>) => (
  <RoutesContext.Provider value={props.routes}>
    {props.children}
  </RoutesContext.Provider>
);

RoutesProvider.displayName = "RoutesProvider";

export function useRoutes() {
  return useContext(RoutesContext);
}

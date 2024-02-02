import { createContext, useContext } from "react";

import type { ActivityRoute } from "./ActivityRoute";

export const RoutesContext = createContext<ActivityRoute[]>([]);

interface RoutesProviderProps {
  routes: ActivityRoute[];
  children: React.ReactNode;
}
export const RoutesProvider: React.FC<RoutesProviderProps> = (props) => (
  <RoutesContext.Provider value={props.routes}>
    {props.children}
  </RoutesContext.Provider>
);

RoutesProvider.displayName = "RoutesProvider";

export function useRoutes() {
  return useContext(RoutesContext);
}

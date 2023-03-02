import { createContext, useContext } from "react";

export type RoutesMap = {
  [activityName in string]?: string | string[];
};

export const RoutesContext = createContext<RoutesMap>({});

interface RoutesProviderProps {
  routes: RoutesMap;
  children: React.ReactNode;
}
export const RoutesProvider = (props: RoutesProviderProps) => (
  <RoutesContext.Provider value={props.routes}>
    {props.children}
  </RoutesContext.Provider>
);

RoutesProvider.displayName = "RoutesProvider";

export function useRoutes() {
  return useContext(RoutesContext);
}

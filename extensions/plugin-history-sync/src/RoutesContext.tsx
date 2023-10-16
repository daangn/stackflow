import type { ActivityComponentType } from "@stackflow/react";
import { createContext, useContext } from "react";

export type Route<K> = {
  path: string;
  decode?: (
    params: Record<string, string>,
  ) => K extends ActivityComponentType<infer U> ? U : never;
};

export type RouteLike<T> = string | string[] | Route<T> | Route<T>[];

export type RoutesMap = {
  [activityName in string]?: RouteLike<unknown>;
};

export const RoutesContext = createContext<RoutesMap>({});

interface RoutesProviderProps {
  routes: RoutesMap;
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

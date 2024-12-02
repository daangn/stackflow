import { createContext, useContext } from "react";

import type { LoadersMap } from "../common/Loader";

export const LoadersContext = createContext<LoadersMap>({});

interface LoadersProviderProps {
  loaders: LoadersMap;
  children: React.ReactNode;
}
export const LoadersProvider: React.FC<LoadersProviderProps> = (props) => (
  <LoadersContext.Provider value={props.loaders}>
    {props.children}
  </LoadersContext.Provider>
);

LoadersProvider.displayName = "LoadersProvider";

export function useLoaders() {
  return useContext(LoadersContext);
}

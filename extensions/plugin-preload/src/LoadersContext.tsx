import React, { createContext, useContext } from "react";

import { Loader } from "./Loader";

export type LoadersMap = {
  [activityName in string]?: Loader;
};

export const LoadersContext = createContext<LoadersMap>(null as any);

interface LoadersProviderProps {
  loaders: LoadersMap;
  children: React.ReactNode;
}
export const LoadersProvider: React.FC<LoadersProviderProps> = (props) => (
  <LoadersContext.Provider value={props.loaders}>
    {props.children}
  </LoadersContext.Provider>
);

export function useLoaders() {
  return useContext(LoadersContext);
}

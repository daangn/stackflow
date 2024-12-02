/* @jsxImportSource solid-js */

import {
  type Component,
  type JSXElement,
  createContext,
  useContext,
} from "solid-js";

import type { LoadersMap } from "../common/Loader";

export const LoadersContext = createContext<() => LoadersMap>(() => ({}));

interface LoadersProviderProps {
  loaders: LoadersMap;
  children: JSXElement;
}
export const LoadersProvider: Component<LoadersProviderProps> = (props) => (
  <LoadersContext.Provider value={() => props.loaders}>
    {props.children}
  </LoadersContext.Provider>
);

export function useLoaders() {
  return useContext(LoadersContext);
}

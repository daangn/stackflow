import { createContext, useContext } from "react";
import type { SyncInspectablePromise } from "../utils/SyncInspectablePromise";

export const LoaderDataContext = createContext<
  SyncInspectablePromise<unknown> | undefined
>(undefined);

export const LoaderDataProvider = LoaderDataContext.Provider;

export function useLoaderDataPromise() {
  return useContext(LoaderDataContext);
}

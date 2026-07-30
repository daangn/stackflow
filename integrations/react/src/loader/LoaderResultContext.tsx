import { createContext, type ReactNode, useContext } from "react";
import type { SyncInspectablePromise } from "../utils/SyncInspectablePromise";

const LoaderResultContext = createContext<
  SyncInspectablePromise<unknown> | undefined
>(undefined);

export function LoaderResultProvider({
  loaderResultPromise,
  children,
}: {
  loaderResultPromise: SyncInspectablePromise<unknown> | undefined;
  children: ReactNode;
}) {
  return (
    <LoaderResultContext.Provider value={loaderResultPromise}>
      {children}
    </LoaderResultContext.Provider>
  );
}

export function useLoaderResultPromise() {
  return useContext(LoaderResultContext);
}

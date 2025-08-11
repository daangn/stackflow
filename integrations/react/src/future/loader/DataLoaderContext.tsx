import { type ReactNode, createContext, useContext } from "react";

export const DataLoaderContext = createContext<
  ((activityName: string, activityParams: {}) => unknown) | null
>(null);

export function DataLoaderProvider({
  loadData,
  children,
}: {
  loadData: (activityName: string, activityParams: {}) => unknown;
  children: ReactNode;
}) {
  return (
    <DataLoaderContext.Provider value={loadData}>
      {children}
    </DataLoaderContext.Provider>
  );
}

export function useDataLoader() {
  const loadData = useContext(DataLoaderContext);

  if (!loadData) {
    throw new Error("useDataLoader() must be used within a DataLoaderProvider");
  }

  return loadData;
}

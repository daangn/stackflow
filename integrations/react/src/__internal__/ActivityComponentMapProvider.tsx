import type { RegisteredActivityName } from "@stackflow/config";
import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";
import type { ActivityComponentType } from "./ActivityComponentType";

const ActivityComponentMapContext = createContext<
  | {
      [activityName in RegisteredActivityName]: ActivityComponentType;
    }
  | null
>(null);

export function useActivityComponentMap() {
  const context = useContext(ActivityComponentMapContext);
  if (context === null) {
    throw new Error(
      "useActivityComponentMap must be used within ActivityComponentMapProvider",
    );
  }
  return context;
}

type ActivityComponentMapProviderProps = PropsWithChildren<{
  value: {
    [activityName in RegisteredActivityName]: ActivityComponentType;
  };
}>;

export function ActivityComponentMapProvider({
  children,
  value,
}: ActivityComponentMapProviderProps) {
  return (
    <ActivityComponentMapContext.Provider value={value}>
      {children}
    </ActivityComponentMapContext.Provider>
  );
}

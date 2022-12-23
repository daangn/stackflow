import type { Activity } from "@stackflow/core";
import React, { createContext } from "react";

import { useMemoDeep } from "../utils";

export const ActivityContext = createContext<Activity>(null as any);

interface ActivityProviderProps {
  children: React.ReactNode;
  value: Activity;
}
export const ActivityProvider: React.FC<ActivityProviderProps> = ({
  children,
  value,
}) => (
  <ActivityContext.Provider value={useMemoDeep(value)}>
    {children}
  </ActivityContext.Provider>
);

ActivityProvider.displayName = "ActivityProvider";

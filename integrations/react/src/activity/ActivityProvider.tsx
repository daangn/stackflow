import { Activity } from "@stackflow/core";
import React from "react";

import { ActivityContext } from "./ActivityContext";

interface ActivityProviderProps {
  activity: Activity;
  children: React.ReactNode;
}
export const ActivityProvider: React.FC<ActivityProviderProps> = ({
  activity,
  children,
}) => (
  <ActivityContext.Provider value={activity}>
    {children}
  </ActivityContext.Provider>
);

import { Activity } from "@stackflow/core";
import React from "react";

import { ActivityContext } from "./ActivityContext";

interface ActivityProviderProps {
  children: React.ReactNode;
  value: Activity;
}
export const ActivityProvider: React.FC<ActivityProviderProps> = ({
  children,
  value,
}) => (
  <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>
);

import type { Activity } from "@stackflow/core";
import React from "react";

import { useMemoDeep } from "../utils";
import { ActivityContext } from "./ActivityContext";

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

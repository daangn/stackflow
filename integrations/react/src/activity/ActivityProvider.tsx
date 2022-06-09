import React from "react";

import { useStack } from "../stack";
import { ActivityContext } from "./ActivityContext";

interface ActivityProviderProps {
  activityId: string;
  children: React.ReactNode;
}
export const ActivityProvider: React.FC<ActivityProviderProps> = ({
  activityId,
  children,
}) => {
  const stack = useStack();

  const activity = stack.activities.find(
    (activity) => activity.id === activityId,
  );

  return (
    <ActivityContext.Provider value={activity!}>
      {children}
    </ActivityContext.Provider>
  );
};

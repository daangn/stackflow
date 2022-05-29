import React, { useMemo } from "react";

import { useCore } from "../core";
import { ActivityContext } from "./ActivityContext";

interface ActivityProviderProps {
  activityId: string;
  children: React.ReactNode;
}
export const ActivityProvider: React.FC<ActivityProviderProps> = ({
  activityId,
  children,
}) => {
  const core = useCore();

  const state = core.state.activities.find(
    (activity) => activity.id === activityId,
  );

  return (
    <ActivityContext.Provider
      value={useMemo(() => ({ state: state! }), [state])}
    >
      {children}
    </ActivityContext.Provider>
  );
};

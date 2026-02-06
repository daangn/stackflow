import type { Activity } from "@stackflow/core";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCoreActions } from "../../__internal__/core/useCoreActions";
import { useCoreSubscribe } from "../../__internal__/core/useCoreSubscribe";
import { ActivityLoaderContext } from "./ActivityLoaderContext";

interface ActivityLoaderProviderProps {
  activity: Activity;
  initialLoaderData: unknown;
  loadData: (activityName: string, activityParams: {}) => unknown;
  shouldInvalidate?: (args: {
    prevActivity: Activity;
    currentActivity: Activity;
  }) => boolean;
  children: ReactNode;
}

export function ActivityLoaderProvider({
  activity,
  initialLoaderData,
  loadData,
  shouldInvalidate,
  children,
}: ActivityLoaderProviderProps) {
  const [loaderData, setLoaderData] = useState(initialLoaderData);
  const actions = useCoreActions();
  const subscribe = useCoreSubscribe();
  const prevActivityRef = useRef<Activity>(activity);

  const invalidate = useCallback(() => {
    const newLoaderData = loadData(activity.name, activity.params);
    setLoaderData(newLoaderData);
  }, [activity.name, activity.params, loadData]);

  useEffect(() => {
    if (!shouldInvalidate) {
      return;
    }

    const unsubscribe = subscribe(() => {
      const stack = actions.getStack();
      const currentActivity = stack.activities.find(
        (a) => a.id === activity.id,
      );

      if (!currentActivity) {
        return;
      }

      const prevActivity = prevActivityRef.current;

      if (shouldInvalidate({ prevActivity, currentActivity })) {
        const newLoaderData = loadData(
          currentActivity.name,
          currentActivity.params,
        );
        setLoaderData(newLoaderData);
      }

      prevActivityRef.current = currentActivity;
    });

    return unsubscribe;
  }, [actions, subscribe, activity.id, loadData, shouldInvalidate]);

  return (
    <ActivityLoaderContext.Provider value={{ loaderData, invalidate }}>
      {children}
    </ActivityLoaderContext.Provider>
  );
}

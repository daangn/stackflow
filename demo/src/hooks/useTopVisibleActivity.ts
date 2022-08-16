import { useMemo } from "react";

import { last } from "./last";
import { useVisibleActivities } from "./useVisibleActivities";

export function useTopVisibleActivity() {
  const visibleActivities = useVisibleActivities();
  return useMemo(() => last(visibleActivities), [visibleActivities]);
}

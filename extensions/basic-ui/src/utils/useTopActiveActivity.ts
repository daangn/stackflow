import { useMemo } from "react";

import { last } from "./last";
import { useActiveActivities } from "./useActiveActivities";

export function useTopActiveActivity() {
  const activeActivities = useActiveActivities();
  return useMemo(() => last(activeActivities), [activeActivities]);
}

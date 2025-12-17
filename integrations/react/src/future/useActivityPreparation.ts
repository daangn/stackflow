import type { RegisteredActivityName } from "@stackflow/config";
import { useEffect } from "react";
import { usePrepare } from "./usePrepare";

export function useActivityPreparation(
  activities: { activityName: RegisteredActivityName }[],
) {
  const prepare = usePrepare();

  useEffect(() => {
    for (const { activityName } of activities) {
      prepare(activityName);
    }
  }, [activities]);
}

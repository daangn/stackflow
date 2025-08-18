import type { RegisteredActivityName } from "@stackflow/config";
import { usePrepare } from "./usePrepare";

export function useActivityPreparation(
  activities: { activityName: RegisteredActivityName }[],
) {
  const prepare = usePrepare();

  for (const { activityName } of activities) {
    prepare(activityName);
  }
}

import type { RegisteredActivityName } from "@stackflow/config";
import { useFlow } from "./useFlow";

export function useActivityPreparation(activities: RegisteredActivityName[]) {
  const actions = useFlow();

  for (const activityName of activities) {
    actions.prepare(activityName);
  }
}

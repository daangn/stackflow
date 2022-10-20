import type { Activity } from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";

type ActivityDepthChangePluginArgs = {
  depth: number;
  activities: Activity[];
  activeActivities: Activity[];
};

type ActivityDepthChangePluginOptions = {
  onInit?: (args: ActivityDepthChangePluginArgs) => void;
  onDepthChanged?: (args: ActivityDepthChangePluginArgs) => void;
};

function getActiveActivities(activities: Activity[]) {
  return activities.filter(
    (activity) =>
      activity.transitionState === "enter-active" ||
      activity.transitionState === "enter-done",
  );
}

export function activityDepthChangePlugin(
  options: ActivityDepthChangePluginOptions,
): StackflowReactPlugin {
  return () => ({
    key: "plugin-activity-depth-change",
    onInit({ actions: { getStack } }) {
      const { activities } = getStack();
      const activeActivities = getActiveActivities(activities);

      options.onInit?.({
        depth: activeActivities.length,
        activeActivities,
        activities,
      });
    },
    onChanged({ actions: { getStack } }) {
      const { activities } = getStack();
      const activeActivities = getActiveActivities(activities);

      options.onDepthChanged?.({
        depth: activeActivities.length,
        activeActivities,
        activities,
      });
    },
  });
}

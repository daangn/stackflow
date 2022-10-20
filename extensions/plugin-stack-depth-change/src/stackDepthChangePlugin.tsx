import type { Activity, StackflowPlugin } from "@stackflow/core";

type StackDepthChangePluginArgs = {
  depth: number;
  activities: Activity[];
  activeActivities: Activity[];
};

type StackDepthChangePluginOptions = {
  onInit?: (args: StackDepthChangePluginArgs) => void;
  onDepthChanged?: (args: StackDepthChangePluginArgs) => void;
};

function getActiveActivities(activities: Activity[]) {
  return activities.filter(
    (activity) =>
      activity.transitionState === "enter-active" ||
      activity.transitionState === "enter-done",
  );
}

export function stackDepthChangePlugin(
  options: StackDepthChangePluginOptions,
): StackflowPlugin {
  return () => ({
    key: "plugin-stack-depth-change",
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

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
  let prevDepth = 0;

  return () => ({
    key: "plugin-stack-depth-change",
    onInit({ actions: { getStack } }) {
      const { activities } = getStack();
      const activeActivities = getActiveActivities(activities);

      const depth = activeActivities.length;

      prevDepth = depth;

      options.onInit?.({
        depth,
        activeActivities,
        activities,
      });
    },
    onChanged({ actions: { getStack } }) {
      const { activities } = getStack();
      const activeActivities = getActiveActivities(activities);

      const depth = activeActivities.length;

      if (prevDepth !== depth) {
        prevDepth = depth;

        options.onDepthChanged?.({
          depth,
          activeActivities,
          activities,
        });
      }
    },
  });
}

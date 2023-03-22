import type { Stack } from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";

function getActiveActivityName(stack: Stack) {
  return stack.activities.find((activity) => activity.isActive)?.name;
}

export type ReferrerPluginOptions = {
  activityParamName?: string;
};
export function autoReferrerPlugin(
  options?: ReferrerPluginOptions,
): StackflowReactPlugin {
  return () => {
    const activityParamName = options?.activityParamName ?? "referrer";

    return {
      key: "@stackflow/plugin-referrer",
      onBeforePush({ actions, actionParams }) {
        const activeActivityName = getActiveActivityName(actions.getStack());

        actions.overrideActionParams({
          ...actionParams,
          activityParams: {
            ...actionParams.activityParams,
            [activityParamName]: activeActivityName,
          },
        });
      },
      onBeforeReplace({ actions, actionParams }) {
        const activeActivityName = getActiveActivityName(actions.getStack());

        actions.overrideActionParams({
          ...actionParams,
          activityParams: {
            ...actionParams.activityParams,
            [activityParamName]: activeActivityName,
          },
        });
      },
    };
  };
}

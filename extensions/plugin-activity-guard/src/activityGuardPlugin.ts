import type { SnapshotEvent, StackflowPlugin } from "@stackflow/core";
import { resolveGuards, type Guards } from './ActivityGuard';

export interface ActivityGuardPluginOptions {
  guards: Guards
}

export function activityGuardPlugin({ guards }: ActivityGuardPluginOptions): StackflowPlugin {
  return () => ({
    key: "@stackflow/plugin-activity-guard",
    overrideInitialEvents({ initialEvents, initInfo }) {
      if (initInfo.kind === "load") {
        return initialEvents;
      }

      const nextEvents: SnapshotEvent[] = []

      for (const event of initialEvents) {
        if (event.name === "Pushed" || event.name === "Replaced") {
          const { target, blocked } = resolveGuards(
            {
              activityName: event.activityName,
              params: event.activityParams
            },
            guards
          );

          if (blocked) {
            nextEvents.push({
              ...event,
              activityName: target.activityName,
              activityParams: target.params
            });

            return nextEvents;
          }
        }

        nextEvents.push(event);
      }

      return nextEvents;
    },
    onBeforePush({ actionParams, actions }) {
      const { target } = resolveGuards({
        activityName: actionParams.activityName,
        params: actionParams.activityParams
      }, guards)

      actions.overrideActionParams({
        ...actionParams,
        ...target,
      });
    },
    onBeforeReplace({ actionParams, actions }) {
      const { target } = resolveGuards({
        activityName: actionParams.activityName,
        params: actionParams.activityParams
      }, guards)

      actions.overrideActionParams({
        ...actionParams,
        ...target,
      });
    },
  });
}

import { id, makeEvent } from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

type MapInitialActivityPluginOptions = {
  mapper(url: URL): {
    activityName: string;
    activityParams: {};
  } | null;
};

export function mapInitialActivityPlugin(
  options: MapInitialActivityPluginOptions,
): StackflowReactPlugin {
  return () => ({
    key: "@stackflow/plugin-override-initial-activity",
    overrideInitialEvents({ initialEvents }) {
      const decoded = options.mapper(new URL(window.location.href));

      if (!decoded) {
        return initialEvents;
      }

      const activityId = id();

      return [
        makeEvent("Pushed", {
          activityId,
          activityName: decoded.activityName,
          activityParams: decoded.activityParams,
          eventDate: new Date().getTime() - MINUTE,
        }),
      ];
    },
  });
}

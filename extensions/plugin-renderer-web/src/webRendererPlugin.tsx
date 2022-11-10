import type { StackflowReactPlugin } from "@stackflow/react";
import React from "react";

export function webRednererPlugin(): StackflowReactPlugin {
  return () => ({
    key: "plugin-renderer-web",
    render({ stack }) {
      return (
        <>
          {stack
            .render()
            .activities.filter(
              (activity) => activity.isActive,
            )
            .map((activity) => (
              <React.Fragment key={activity.key}>
                {activity.render()}
              </React.Fragment>
            ))}
        </>
      );
    },
  });
}

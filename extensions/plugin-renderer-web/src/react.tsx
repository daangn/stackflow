import type { StackflowReactPlugin } from "@stackflow/react";
import { Fragment } from "react";

export function webRendererPlugin(): StackflowReactPlugin {
  return () => ({
    key: "plugin-renderer-web",
    render({ stack }) {
      return (
        <>
          {stack
            .render()
            .activities.filter((activity) => activity.isActive)
            .map((activity) => (
              <Fragment key={activity.key}>{activity.render()}</Fragment>
            ))}
        </>
      );
    },
  });
}

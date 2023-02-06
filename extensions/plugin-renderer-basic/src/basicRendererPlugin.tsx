import type { StackflowReactPlugin } from "@stackflow/react";
import { Fragment } from "react";

export function basicRendererPlugin(): StackflowReactPlugin {
  return () => ({
    key: "plugin-renderer-basic",
    render({ stack }) {
      return (
        <>
          {stack
            .render()
            .activities.filter(
              (activity) => activity.transitionState !== "exit-done",
            )
            .map((activity) => (
              <Fragment key={activity.key}>{activity.render()}</Fragment>
            ))}
        </>
      );
    },
  });
}

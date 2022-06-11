import { StackflowReactPlugin } from "@stackflow/react";
import React from "react";

const last = <T extends unknown>(arr: T[]) => arr[arr.length - 1];

export function renderPlugin(): StackflowReactPlugin {
  return () => ({
    key: "render",
    render({ stack }) {
      return (
        <>
          {stack
            .render()
            .activities.filter(
              (activity) => activity.transitionState !== "exit-done",
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

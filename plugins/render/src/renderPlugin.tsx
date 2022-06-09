import { StackflowReactPlugin } from "@stackflow/react";
import React from "react";

const last = <T extends unknown>(arr: T[]) => arr[arr.length - 1];

interface RenderPluginOptions {
  persist?: boolean;
}
export function renderPlugin({
  persist = true,
}: RenderPluginOptions): StackflowReactPlugin {
  return () => ({
    key: "render",
    renderStack({ stack }) {
      if (persist) {
        return (
          <>
            {stack.activities.map((activity) => (
              <React.Fragment key={activity.key}>
                {activity.render()}
              </React.Fragment>
            ))}
          </>
        );
      }

      const lastActivity = last(stack.activities);
      return <>{lastActivity.render()}</>;
    },
  });
}

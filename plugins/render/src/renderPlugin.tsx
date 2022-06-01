import { StackflowPlugin } from "@stackflow/react";
import React from "react";

interface RenderPluginOptions {
  persist?: boolean;
}
export function renderPlugin({
  persist = true,
}: RenderPluginOptions): StackflowPlugin {
  return {
    id: "render",
    render({ activities }) {
      if (persist) {
        return (
          <>
            {activities.map((activity) => (
              <React.Fragment key={activity.key}>
                {activity.render()}
              </React.Fragment>
            ))}
          </>
        );
      }

      const lastActivity = activities[activities.length - 1];
      return <>{lastActivity.render()}</>;
    },
  };
}

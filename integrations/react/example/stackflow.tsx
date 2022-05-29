import React from "react";

import { stackflow, StackflowPlugin } from "../src";
import Hello from "./Hello";

function examplePlugin(): StackflowPlugin {
  return {
    id: new Date().getTime().toString(),
    render({ activities }) {
      return (
        <div>
          {activities.map((activity) => (
            <div key={activity.key}>{activity.render()}</div>
          ))}
        </div>
      );
    },
  };
}

export const { Stack, useFlow } = stackflow({
  transitionDuration: 300,
  activities: {
    Hello,
  },
  plugins: [examplePlugin()],
});

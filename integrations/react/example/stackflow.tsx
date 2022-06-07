import React from "react";

import { makeStackflow } from "../src";
import Hello from "./Hello";

export const { Stack, useFlow } = makeStackflow({
  transitionDuration: 300,
  activities: {
    Hello,
  },
  initialActivity: () => "Hello",
  plugins: [
    {
      id: "123",
      render({ activities }) {
        return (
          <div>
            {activities.map((activity) => (
              <div key={activity.id}>{activity.render()}</div>
            ))}
          </div>
        );
      },
    },
  ],
});

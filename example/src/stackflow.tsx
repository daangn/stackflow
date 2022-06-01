import { renderPlugin } from "@stackflow/plugin-render";
import { stackflow } from "@stackflow/react";

import Hello from "./Hello";

export const { Stack, useFlow } = stackflow({
  transitionDuration: 300,
  activities: {
    Hello,
  },
  plugins: [
    renderPlugin({
      persist: true,
    }),
  ],
});

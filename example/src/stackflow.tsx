import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { renderPlugin } from "@stackflow/plugin-render";
import { stackflow } from "@stackflow/react";

import Hello from "./Hello";

export const { Stack, useFlow } = stackflow({
  transitionDuration: 1000,
  activities: {
    Hello,
  },
  plugins: [
    renderPlugin({
      persist: true,
    }),
    historySyncPlugin({}),
  ],
});

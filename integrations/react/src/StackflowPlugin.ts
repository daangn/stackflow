import React from "react";

import { CoreLifeCycleHook } from "./core";

export interface StackflowPlugin {
  id: string;
  render?: (args: {
    activities: Array<{
      key: string;
      render: () => React.ReactNode;
    }>;
  }) => React.ReactElement<any, any> | null;
  onPushed?: CoreLifeCycleHook<"PUSHED">;
  onPopped?: CoreLifeCycleHook<"POPPED">;
}

import { PushedEvent } from "@stackflow/core/dist/event-types";
import React from "react";

import { CoreLifeCycleHook, CoreLifeCycleHookInit } from "./core";

export type StackflowPlugin = () => {
  id: string;
  render?: (args: {
    activities: Array<{
      key: string;
      render: () => React.ReactNode;
    }>;
  }) => React.ReactElement<any, any> | null;
  initialPushedEvent?: () => PushedEvent | null;
  onInit?: CoreLifeCycleHookInit;
  onPushed?: CoreLifeCycleHook<"PUSHED">;
  onPopped?: CoreLifeCycleHook<"POPPED">;
};

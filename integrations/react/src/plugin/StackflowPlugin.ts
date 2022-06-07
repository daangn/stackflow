import { PushedEvent } from "@stackflow/core/dist/event-types";
import React from "react";

import {
  StackflowPluginEffectHook,
  StackflowPluginHook,
  StackflowPluginPreEffectHook,
} from "./StackflowPluginHook";

export type StackflowPlugin = () => {
  key: string;
  render?: (args: {
    activities: Array<{
      key: string;
      render: () => React.ReactNode;
    }>;
  }) => React.ReactElement<any, any> | null;
  onInit?: StackflowPluginHook;
  onBeforePop?: StackflowPluginPreEffectHook;
  onPushed?: StackflowPluginEffectHook<"PUSHED">;
  onPopped?: StackflowPluginEffectHook<"POPPED">;
  onReplaced?: StackflowPluginEffectHook<"REPLACED">;
  onChanged?: StackflowPluginEffectHook<"%SOMETHING_CHANGED%">;
  overrideInitialPushedEvent?: (args: {
    stackContext: any;
  }) => PushedEvent | null;
};

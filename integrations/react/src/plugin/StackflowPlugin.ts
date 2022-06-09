import { PushedEvent } from "@stackflow/core/dist/event-types";
import React from "react";

import {
  StackflowPluginHook,
  StackflowPluginPostEffectHook,
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
  wrapStack?: (args: {
    stack: {
      render: () => React.ReactNode;
    };
  }) => React.ReactElement<any, any> | null;
  wrapActivity?: (args: {
    activity: {
      id: string;
      name: string;
      render: () => React.ReactNode;
    };
  }) => React.ReactElement<any, any> | null;
  onInit?: StackflowPluginHook;
  onBeforePop?: StackflowPluginPreEffectHook;
  onPushed?: StackflowPluginPostEffectHook<"PUSHED">;
  onPopped?: StackflowPluginPostEffectHook<"POPPED">;
  onReplaced?: StackflowPluginPostEffectHook<"REPLACED">;
  onChanged?: StackflowPluginPostEffectHook<"%SOMETHING_CHANGED%">;
  overrideInitialPushedEvent?: (args: {
    stackContext: any;
  }) => PushedEvent | null;
};

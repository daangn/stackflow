import { Effect } from "@stackflow/core";

import { StackflowPluginActions } from "./StackflowPluginActions";

export type StackflowPluginHook = (actions: StackflowPluginActions) => void;

export type StackflowPluginPreEffectHook = (
  actions: StackflowPluginActions & { preventDefault: () => void },
) => void;

export type StackflowPluginEffectHook<T extends Effect["_TAG"]> = (
  actions: StackflowPluginActions,
  effect: Extract<Effect, { _TAG: T }>,
) => void;

import type { Effect } from "../Effect";
import type { StackflowActions } from "./StackflowActions";

export type StackflowPluginHook = (args: {
  actions: StackflowActions;
  /**
   * Which path created this stack — `"create"` (fresh) or `"load"` (restored
   * from a snapshot). A one-shot signal that leaves no trace on the stack.
   */
  initializedBy: "create" | "load";
}) => void;

export type StackflowPluginPreEffectHook<T> = (args: {
  actionParams: T;
  actions: StackflowActions & {
    preventDefault: () => void;
    overrideActionParams: (params: T) => void;
  };
}) => void;

export type StackflowPluginPostEffectHook<T extends Effect["_TAG"]> = (args: {
  actions: StackflowActions;
  effect: Extract<Effect, { _TAG: T }>;
}) => void;

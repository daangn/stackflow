import { Effect } from "../Effect";
import { StackflowPluginActions } from "./StackflowPluginActions";

export type StackflowPluginHook = (args: {
  actions: StackflowPluginActions;
}) => void;

export type StackflowPluginPreEffectHook = (args: {
  actions: StackflowPluginActions & { preventDefault: () => void };
}) => void;

export type StackflowPluginPostEffectHook<T extends Effect["_TAG"]> = (args: {
  actions: StackflowPluginActions;
  effect: Extract<Effect, { _TAG: T }>;
}) => void;

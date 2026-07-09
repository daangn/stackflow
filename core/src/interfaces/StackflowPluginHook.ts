import type { Effect } from "../Effect";
import type { StackflowActions } from "./StackflowActions";

/**
 * Which path created this stack — `{ kind: "create" }` (fresh) or
 * `{ kind: "load" }` (restored from a snapshot). A one-shot signal that
 * leaves no trace on the stack. A record rather than a bare string so
 * per-path fields can be added later without breaking hook signatures.
 * `onInit` and `overrideInitialEvents` receive the signal in this same shape.
 */
export type StackInitInfo = { kind: "create" | "load" };

export type StackflowPluginHook = (args: {
  actions: StackflowActions;
  initInfo: StackInitInfo;
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

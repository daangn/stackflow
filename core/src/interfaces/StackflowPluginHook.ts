import type { Effect } from "../Effect";
import type { StackflowActions } from "./StackflowActions";

export type StackflowPluginHook = (args: {
  actions: StackflowActions;
  /**
   * Which path created this stack — `{ kind: "create" }` (fresh) or
   * `{ kind: "load" }` (restored from a snapshot). A one-shot signal that
   * leaves no trace on the stack. A record rather than a bare string so
   * per-path fields can be added later without breaking the hook signature.
   */
  initInfo: { kind: "create" | "load" };
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

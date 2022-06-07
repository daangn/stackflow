import { DispatchEvent, Effect } from "@stackflow/core";

export type CoreLifeCycleHook<T extends Effect["_TAG"]> = (
  actions: {
    dispatchEvent: DispatchEvent;
  },
  effect: Extract<Effect, { _TAG: T }>,
) => void;

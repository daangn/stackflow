import { AggregateOutput, Effect } from "@stackflow/core";

import { CoreActions } from "./CoreActions";

export type CoreLifeCycleHook<T extends Effect["_TAG"]> = (
  actions: CoreActions,
  effect: Extract<Effect, { _TAG: T }>,
) => void;

export type CoreLifeCycleHookInit = (
  actions: CoreActions,
  state: AggregateOutput,
) => void;

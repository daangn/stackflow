import type { StackflowPluginActions } from "@stackflow/core";
import React from "react";

import type { BaseActivities } from "./BaseActivities";
import { useCoreActions } from "./core";
import type { UseActionsOutputType } from "./useActions";
import { useActions } from "./useActions";

export type StackRefCurrentType<T extends BaseActivities> = {
  actions: Pick<StackflowPluginActions, "dispatchEvent" | "getStack"> &
    Pick<UseActionsOutputType<T>, "push" | "pop" | "replace">;
};

const StackRefManager = React.forwardRef<
  StackRefCurrentType<BaseActivities>,
  {}
>((_, ref) => {
  const { dispatchEvent, getStack } = useCoreActions();
  const { push, pop, replace } = useActions();

  React.useImperativeHandle(ref, () => ({
    actions: {
      dispatchEvent,
      getStack,
      push,
      pop,
      replace,
    },
  }));

  return null;
});

export default StackRefManager;

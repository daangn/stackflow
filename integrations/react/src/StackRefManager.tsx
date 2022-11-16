import type { StackflowPluginActions } from "@stackflow/core";
import React from "react";

import type { BaseActivities } from "./BaseActivities";
import { useCoreActions } from "./core";
import type { UseActionsOutputType } from "./useActions";
import { useActions } from "./useActions";
import type { UseNestedActionsOutputType } from "./useNestedActions";
import { useNestedActions } from "./useNestedActions";

export type StackRefCurrentType<T extends BaseActivities> = {
  actions: Pick<StackflowPluginActions, "dispatchEvent" | "getStack"> &
    Pick<UseActionsOutputType<T>, "push" | "pop" | "replace"> &
    Pick<
      UseNestedActionsOutputType<{}>,
      "nestedPush" | "nestedReplace" | "nestedPop"
    >;
};

const StackRefManager = React.forwardRef<
  StackRefCurrentType<BaseActivities>,
  {}
>((_, ref) => {
  const { dispatchEvent, getStack } = useCoreActions();
  const { push, pop, replace } = useActions();
  const { nestedPush, nestedPop, nestedReplace } = useNestedActions(
    "" as never,
  );

  React.useImperativeHandle(ref, () => ({
    actions: {
      dispatchEvent,
      getStack,
      push,
      pop,
      replace,
      nestedPush,
      nestedPop,
      nestedReplace,
    },
  }));

  return null;
});

export default StackRefManager;

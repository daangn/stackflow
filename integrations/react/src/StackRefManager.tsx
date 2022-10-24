import React from "react";

import type { BaseActivities } from "./BaseActivities";
import type { CoreActionsContextValue } from "./core";
import { useCoreActions } from "./core";
import type { UseActionsOutputType } from "./useActions";
import { useActions } from "./useActions";

export type StackRefCurrentType<T extends BaseActivities> = {
  actions: Pick<UseActionsOutputType<T>, "push" | "pop" | "replace"> &
    CoreActionsContextValue;
};

const StackRefManager = React.forwardRef<
  StackRefCurrentType<BaseActivities>,
  {}
>((_, ref) => {
  const { push, pop, replace } = useActions();
  const { dispatchEvent, getStack } = useCoreActions();

  React.useImperativeHandle(ref, () => ({
    actions: {
      push,
      pop,
      replace,
      dispatchEvent,
      getStack,
    },
  }));

  return null;
});

export default StackRefManager;

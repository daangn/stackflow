import React from "react";

import type { BaseActivities } from "./BaseActivities";
import { useCoreActions } from "./core";
import type { StackRefCurrentType } from "./createStackRef";
import { useActions } from "./useActions";

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

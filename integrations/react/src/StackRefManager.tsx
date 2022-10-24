import React from "react";

import type { BaseActivities } from "./BaseActivities";
import { CoreActionsContext } from "./core/CoreActionsContext";
import type { StackRefCurrentType } from "./createStackRef";
import { useActions } from "./useActions";

const StackRefManager = React.forwardRef<
  StackRefCurrentType<BaseActivities> | undefined,
  {}
>((_, ref) => {
  const actions = useActions();
  const { dispatchEvent, getStack } = React.useContext(CoreActionsContext);

  React.useImperativeHandle(
    ref,
    React.useCallback(
      () => ({
        actions: {
          ...actions,
          dispatchEvent,
          getStack,
        },
      }),
      [actions, dispatchEvent, getStack],
    ),
  );

  return null;
});

export default StackRefManager;

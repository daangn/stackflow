import type { BaseActivities } from "BaseActivities";
import React from "react";
import type { UseActionsOutputType } from "useActions";
import { useActions } from "useActions";

const RefManager = React.forwardRef<UseActionsOutputType<BaseActivities>, {}>(
  (_, ref) => {
    const actions = useActions();
    React.useImperativeHandle(
      ref,
      React.useCallback(() => actions, [actions]),
    );
    return null;
  },
);

export default RefManager;

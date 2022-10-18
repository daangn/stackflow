import React from "react";

import type { BaseActivities } from "./BaseActivities";
import type { UseActionsOutputType } from "./useActions";
import { useActions } from "./useActions";

const ActionRefManager = React.forwardRef<
  UseActionsOutputType<BaseActivities>,
  {}
>((_, ref) => {
  const actions = useActions();
  React.useImperativeHandle(
    ref,
    React.useCallback(() => actions, [actions]),
  );
  return null;
});

export default ActionRefManager;

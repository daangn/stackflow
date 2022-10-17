import React from "react";
import type { ActionRefType } from "stackflow";
import { useActions } from "useActions";

const RefManager = React.forwardRef<ActionRefType, {}>((_, ref) => {
  const actions = useActions();
  React.useImperativeHandle(
    ref,
    React.useCallback(() => actions, [actions]),
  );
  return null;
});

export default RefManager;

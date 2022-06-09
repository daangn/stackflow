import { useContext, useMemo } from "react";

import { StackContext } from "./StackContext";

export const useStackActions = () => {
  const { dispatchEvent, getState } = useContext(StackContext);

  return useMemo(
    () => ({
      dispatchEvent,
      getState,
    }),
    [dispatchEvent, getState],
  );
};

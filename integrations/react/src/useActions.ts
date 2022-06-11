import { useMemo } from "react";

import { useCoreActions } from "./core";

export const useActions = () => {
  const coreActions = useCoreActions();

  return useMemo(
    () => ({
      push: coreActions.push,
      replace: coreActions.replace,
      pop: coreActions.pop,
    }),
    [coreActions],
  );
};

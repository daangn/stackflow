import { useMemo } from "react";

import { useCore } from "../core";

export const useStackActions = () => {
  const core = useCore();

  return useMemo(
    () => ({
      push: core.push,
      replace: core.replace,
      pop: core.pop,
    }),
    [core],
  );
};

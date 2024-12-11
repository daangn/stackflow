import { useContext } from "solid-js";

import { CoreStateContext } from "./CoreProvider";

export const useCoreState = () => {
  const coreState = useContext(CoreStateContext);

  if (!coreState) {
    throw new Error("useCoreState must be used within a <CoreProvider />");
  }

  return coreState;
};

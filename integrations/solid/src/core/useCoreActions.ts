import { useContext } from "solid-js";

import { CoreActionsContext } from "./CoreProvider";

export const useCoreActions = () => {
  const coreActions = useContext(CoreActionsContext);

  if (!coreActions) {
    throw new Error("useCoreActions must be used within a <CoreProvider />");
  }

  return coreActions;
};

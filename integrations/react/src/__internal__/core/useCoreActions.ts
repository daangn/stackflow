import { useContext } from "react";

import { UNSAFE_CoreActionsContext } from "./CoreProvider";

export const useCoreActions = () => useContext(UNSAFE_CoreActionsContext);

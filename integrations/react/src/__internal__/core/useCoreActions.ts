import { useContext } from "react";

import { CoreActionsContext } from "./CoreProvider";

export const useCoreActions = () => useContext(CoreActionsContext);

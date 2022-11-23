import React from "react";

import { CoreActionsContext } from "./CoreProvider";

export const useCoreActions = () => React.useContext(CoreActionsContext);

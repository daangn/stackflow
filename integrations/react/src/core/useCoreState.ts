import React from "react";

import { CoreStateContext } from "./CoreStateContext";

export const useCoreState = () => React.useContext(CoreStateContext);

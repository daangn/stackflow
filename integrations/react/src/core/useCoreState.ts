import React from "react";

import { CoreStateContext } from "./CoreProvider";

export const useCoreState = () => React.useContext(CoreStateContext);

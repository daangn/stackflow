import { useContext } from "react";

import { CoreStateContext } from "./CoreProvider";

export const useCoreState = () => useContext(CoreStateContext);

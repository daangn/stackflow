import { useContext } from "react";

import { UNSAFE_CoreStateContext } from "./CoreProvider";

export const useCoreState = () => useContext(UNSAFE_CoreStateContext);

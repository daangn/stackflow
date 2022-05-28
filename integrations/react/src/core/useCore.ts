import { useContext } from "react";

import { CoreContext } from "./CoreContext";

export const useCore = () => useContext(CoreContext);

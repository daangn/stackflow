import { useContext } from "react";

import { StackflowCoreContext } from "./StackflowCoreProvider";

export function useStackflowCore() {
  return useContext(StackflowCoreContext);
}

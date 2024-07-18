import { useContext } from "react";

import { StackContext } from "./StackProvider";

/**
 * Get overall stack state
 */
export const useStack = () => useContext(StackContext);

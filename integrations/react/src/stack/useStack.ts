import { useContext } from "react";

import { StackContext } from "./StackContext";

/**
 * Get overall stack state
 */
export const useStack = () => useContext(StackContext);

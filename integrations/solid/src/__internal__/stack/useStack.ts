import { useContext } from "solid-js";

import { StackContext } from "./StackProvider";

/**
 * Get overall stack state
 */
export const useStack = () => {
  const stack = useContext(StackContext);

  if (!stack) {
    throw new Error("useStack() must be used within a <StackProvider />");
  }

  return stack;
};

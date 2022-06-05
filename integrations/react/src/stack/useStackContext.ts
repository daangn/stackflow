import { useContext } from "react";

import { StackContextContext } from "./StackContextContext";

export function useStackContext() {
  return useContext(StackContextContext);
}

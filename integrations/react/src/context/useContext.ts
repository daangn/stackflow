import React from "react";

import { ContextContext } from "./ContextContext";

export function useContext() {
  return React.useContext(ContextContext);
}

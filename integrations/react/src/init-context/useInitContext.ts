import React from "react";

import { InitContextContext } from "./InitContextContext";

export function useInitContext() {
  return React.useContext(InitContextContext);
}

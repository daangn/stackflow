import { useActions } from "@stackflow/react";

import type { TypeActivities } from "./stackflow";

export function useFlow() {
  return useActions<TypeActivities>();
}

import { useActions } from "@stackflow/solid";

import type { TypeActivities } from "./stackflow";

export function useFlow() {
  return useActions<TypeActivities>();
}

import type { Activity } from "@stackflow/core";
import { useActivity } from "@stackflow/react";

export function useNullableActivity() {
  return useActivity() as Activity | null;
}

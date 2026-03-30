import type { Stack } from "@stackflow/core";
import { useStack } from "@stackflow/react";

export function useNullableStack() {
  return useStack() as Stack | null;
}

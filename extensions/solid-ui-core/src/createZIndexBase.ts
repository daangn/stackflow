import { useActivity } from "@stackflow/solid";
import { createMemo } from "solid-js";

export function createZIndexBase() {
  const activity = useActivity();
  return createMemo(() => (activity()?.zIndex ?? 0) * 5);
}

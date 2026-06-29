import { useSyncExternalStore } from "react";
import { harnessStore } from "./harnessStore";

/** Re-render the caller whenever the harness store mutates. */
export function useHarnessVersion(): number {
  return useSyncExternalStore(harnessStore.subscribe, harnessStore.getVersion);
}

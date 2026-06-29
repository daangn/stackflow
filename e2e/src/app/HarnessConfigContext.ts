import { createContext, useContext } from "react";
import type { HarnessConfig } from "./query";

/** Injects the per-instance harness configuration to activities. */
export const HarnessConfigContext = createContext<HarnessConfig | null>(null);

export function useHarnessConfig(): HarnessConfig {
  const config = useContext(HarnessConfigContext);
  if (!config) {
    throw new Error("HarnessConfigContext is not provided");
  }
  return config;
}

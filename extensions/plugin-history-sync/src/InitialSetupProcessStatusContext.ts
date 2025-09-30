import { createContext, useContext } from "react";
import type { NavigationProcessStatus } from "./NavigationProcess/NavigationProcess";

export const InitialSetupProcessStatusContext =
  createContext<NavigationProcessStatus | null>(null);

export function useInitialSetupProcessStatus(): NavigationProcessStatus {
  const status = useContext(InitialSetupProcessStatusContext);

  if (!status) {
    throw new Error("InitialSetupProcessStatusContext is not found");
  }

  return status;
}

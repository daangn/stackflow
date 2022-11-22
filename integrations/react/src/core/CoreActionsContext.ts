import type { CreateCoreStoreOutput } from "@stackflow/core";
import { createContext } from "react";

export const CoreActionsContext = createContext<
  CreateCoreStoreOutput["coreActions"]
>(null as any);

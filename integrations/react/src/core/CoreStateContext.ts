import { AggregateOutput } from "@stackflow/core";
import { createContext } from "react";

export const CoreStateContext = createContext<AggregateOutput>(null as any);

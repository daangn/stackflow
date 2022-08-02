import type { AggregateOutput } from "@stackflow/core";
import { createContext } from "react";

export const StackContext = createContext<AggregateOutput>(null as any);

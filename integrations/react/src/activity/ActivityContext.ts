import type { Activity } from "@stackflow/core";
import { createContext } from "react";

export const ActivityContext = createContext<Activity>(null as any);

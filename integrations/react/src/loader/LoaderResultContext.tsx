import { createContext } from "react";
import type { SyncInspectablePromise } from "../utils/SyncInspectablePromise";

export const LoaderResultContext = createContext<
  SyncInspectablePromise<unknown> | undefined
>(undefined);

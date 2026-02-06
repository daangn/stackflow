import { createContext } from "react";

export interface ActivityLoaderContextValue {
  loaderData: unknown;
  invalidate: () => void;
}

export const ActivityLoaderContext =
  createContext<ActivityLoaderContextValue | null>(null);

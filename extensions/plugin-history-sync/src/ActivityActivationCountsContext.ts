import { createContext } from "react";

export const ActivityActivationCountsContext = createContext<
  { activityId: string; activationCount: number }[]
>([]);

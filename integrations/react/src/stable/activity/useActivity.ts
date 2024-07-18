import { useContext } from "react";

import { ActivityContext } from "./ActivityProvider";

/**
 * Get current activity state
 */
export const useActivity = () => useContext(ActivityContext);

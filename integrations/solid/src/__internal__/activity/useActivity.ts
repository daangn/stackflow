import { useContext } from "solid-js";

import { ActivityContext } from "./ActivityProvider";

/**
 * Get current activity state
 */
export const useActivity = () => useContext(ActivityContext);

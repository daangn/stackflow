import { useContext } from "react";

import { ActivityContext } from "./ActivityContext";

/**
 * Get current activity state
 */
export const useActivity = () => useContext(ActivityContext);

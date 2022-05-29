import { useContext } from "react";

import { ActivityContext } from "./ActivityContext";

export const useActivity = () => useContext(ActivityContext);

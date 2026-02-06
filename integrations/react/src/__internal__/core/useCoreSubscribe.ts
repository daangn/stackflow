import { useContext } from "react";

import { CoreSubscribeContext } from "./CoreProvider";

export const useCoreSubscribe = () => useContext(CoreSubscribeContext);

import { useContext } from "react";

import { StackContext } from "./StackContext";

export const useStack = () => useContext(StackContext);

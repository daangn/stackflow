import { flow } from "@stackflow/react/future";
import type { Actions } from "./Stack";

export const { useFlow } = flow<Actions>();

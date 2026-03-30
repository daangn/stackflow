import type {
  ActivityDefinition,
  Config,
  RegisteredActivityName,
} from "@stackflow/config";
import { useContext } from "react";
import { ConfigContext } from "./ConfigProvider";

export function useConfig(): Config<
  ActivityDefinition<RegisteredActivityName>
> {
  return useContext(ConfigContext);
}

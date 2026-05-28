import type {
  ActivityDefinition,
  Config,
  RegisteredActivityName,
} from "@stackflow/config";
import type React from "react";
import { createContext } from "react";

export const ConfigContext = createContext<
  Config<ActivityDefinition<RegisteredActivityName>>
>(null as any);

interface ConfigProviderProps {
  children: React.ReactNode;
  value: Config<ActivityDefinition<RegisteredActivityName>>;
}
export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  children,
  value,
}) => <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;

ConfigProvider.displayName = "ConfigProvider";

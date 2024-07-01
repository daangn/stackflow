import type { ActivityDefinition, Config } from "@stackflow/config";
import { type Component, type JSX, createContext } from "solid-js";

export const ConfigContext = createContext<Config<ActivityDefinition<string>>>(
  null as any,
);

interface ConfigProviderProps {
  children: JSX.Element;
  value: Config<ActivityDefinition<string>>;
}
export const ConfigProvider: Component<ConfigProviderProps> = (props) => (
  <ConfigContext.Provider value={props.value}>
    {props.children}
  </ConfigContext.Provider>
);

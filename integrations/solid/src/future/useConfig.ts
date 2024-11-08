import { useContext } from "solid-js";
import { ConfigContext } from "./ConfigProvider";

export function useConfig() {
  return useContext(ConfigContext);
}

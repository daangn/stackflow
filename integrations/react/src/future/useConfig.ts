import { useContext } from "react";
import { ConfigContext } from "./ConfigProvider";

export function useConfig() {
  return useContext(ConfigContext);
}

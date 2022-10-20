import { createContext, useContext } from "react";

const ThemeContext = createContext<"android" | "cupertino">("android");

export const ThemeProvider = ThemeContext.Provider;

export function useTheme() {
  return useContext(ThemeContext);
}

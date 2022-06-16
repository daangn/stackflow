import React, { createContext, useContext, useMemo } from "react";

const AppScreenThemeContext = createContext<"android" | "cupertino">(
  "cupertino",
);

export const useAppScreenTheme = () => useContext(AppScreenThemeContext);

interface AppScreenThemeProviderProps {
  children: React.ReactNode;
}
export const AppScreenThemeProvider: React.FC<AppScreenThemeProviderProps> = ({
  children,
}) => (
  <AppScreenThemeContext.Provider value="cupertino">
    {children}
  </AppScreenThemeContext.Provider>
);

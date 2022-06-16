import React from "react";

import { AppScreenThemeProvider } from "./AppScreenThemeContext";
import { Stack } from "./index";

const App: React.FC = () => (
  <AppScreenThemeProvider>
    <Stack />
  </AppScreenThemeProvider>
);

export default App;

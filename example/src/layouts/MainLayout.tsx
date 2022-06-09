import { AppScreen } from "@stackflow/ui";
import React from "react";

const theme = "cupertino";

interface MainLayoutProps {
  children: React.ReactNode;
}
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => (
  <AppScreen
    theme={theme}
    appBar={{
      onClose() {
        console.log("Close");
      },
    }}
  >
    {children}
  </AppScreen>
);

export default MainLayout;

import { AppScreen } from "@stackflow/plugin-basic-ui";
import React from "react";

type PropOf<T> = T extends React.ComponentType<infer U> ? U : never;

interface LayoutProps {
  appBar?: PropOf<typeof AppScreen>["appBar"];
  showAppBar?: boolean;
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ appBar, showAppBar, children }) => (
  <AppScreen appBar={appBar} showAppBar={showAppBar}>
    {children}
  </AppScreen>
);
export default Layout;

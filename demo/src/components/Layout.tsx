import { AppScreen } from "@stackflow/plugin-basic-ui";

type PropOf<T> = T extends React.ComponentType<infer U> ? U : never;

interface LayoutProps {
  appBar?: PropOf<typeof AppScreen>["appBar"];
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ appBar, children }) => (
  <AppScreen
    appBar={appBar}
    backgroundImage="linear-gradient(to bottom, #1a2a3d, #2c3e50, #34495e, #2c3e50, #1a2a3d)"
  >
    {children}
  </AppScreen>
);

Layout.displayName = "Layout";

export default Layout;

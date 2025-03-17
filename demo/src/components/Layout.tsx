import { AppScreen } from "@stackflow/plugin-basic-ui";

type PropOf<T> = T extends React.ComponentType<infer U> ? U : never;

interface LayoutProps {
  appBar?: PropOf<typeof AppScreen>["appBar"];
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ appBar, children }) => (
  <AppScreen
    appBar={{
      ...appBar,
      enterStyle: "cover",
    }}
    backgroundImage="linear-gradient(to bottom, #4B0082, #663399, #8A2BE2, #9370DB, #BA55D3, #9370DB, #8A2BE2, #663399, #4B0082)"
  >
    {children}
  </AppScreen>
);

Layout.displayName = "Layout";

export default Layout;

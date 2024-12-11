import { AppScreen } from "@stackflow/plugin-basic-ui/solid";
import type { Component, JSXElement } from "solid-js";

type PropOf<T> = T extends Component<infer U> ? U : never;

interface LayoutProps {
  appBar?: PropOf<typeof AppScreen>["appBar"];
  children: JSXElement;
}
const Layout: Component<LayoutProps> = ({ appBar, children }) => (
  <AppScreen appBar={appBar}>{children}</AppScreen>
);

export default Layout;

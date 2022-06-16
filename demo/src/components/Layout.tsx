import { vars } from "@seed-design/design-token";
import { AppScreen } from "@stackflow/basic-ui";
import React from "react";

import { useAppScreenTheme } from "../AppScreenThemeContext";

type PropOf<T> = T extends React.ComponentType<infer U> ? U : unknown;

interface LayoutProps {
  appBar?: PropOf<typeof AppScreen>["appBar"];
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ appBar, children }) => {
  const theme = useAppScreenTheme();

  const borderColor =
    theme === "cupertino"
      ? vars.$semantic.color.divider3
      : vars.$semantic.color.divider2;

  return (
    <AppScreen
      theme={theme}
      backgroundColor={vars.$semantic.color.paperDefault}
      appBar={{
        borderColor,
        textColor: vars.$scale.color.gray900,
        iconColor: vars.$scale.color.gray900,
        ...appBar,
      }}
    >
      {children}
    </AppScreen>
  );
};

export default Layout;

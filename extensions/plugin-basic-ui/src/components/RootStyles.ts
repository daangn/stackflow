import { useLayoutEffect } from "react";

export type RootStylesProps = {
  theme: "android" | "cupertino";
  styles: {
    [cssVarName: string]: string | undefined;
  };
};
export function RootStyles({ theme, styles }: RootStylesProps) {
  useLayoutEffect(() => {
    const root = document.querySelector(":root") as HTMLHtmlElement;

    if (!root) {
      return;
    }

    for (const [key, value] of Object.entries(styles)) {
      if (value) {
        root.style.setProperty(key, value);
      }
    }

    root.dataset.stackflowPluginBasicUiTheme = theme;
  }, [styles, theme]);

  return null;
}

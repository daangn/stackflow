import {
  createGlobalTheme,
  createGlobalThemeContract,
  createTheme,
} from "@vanilla-extract/css";

export const globalVars = createGlobalThemeContract(
  {
    backgroundColor: "background-color",
    dimBackgroundColor: "dim-background-color",
    appBar: {
      iconColor: "app-bar-icon-color",
      textColor: "app-bar-text-color",
      height: "app-bar-height",
      borderColor: "app-bar-border-color",
      borderSize: "app-bar-border-size",
    },
  },
  (value) => `stackflow-basic-ui-${value}`,
);

const defaultVars = {
  backgroundColor: "#fff",
  dimBackgroundColor: "rgba(0, 0, 0, 0.15)",
  appBar: {
    iconColor: "#212124",
    textColor: "#212124",
    height: "3.5rem",
    borderColor: "rgba(0, 0, 0, 0.07)",
    borderSize: "1px",
  },
};

const cupertinoVars = {
  ...defaultVars,
  appBar: {
    ...defaultVars.appBar,
    height: "2.75rem",
    borderSize: "0.5px",
  },
};

const root = ":root";
export const rootAndroid = ":root[data-stackflow-basic-ui-theme=android]";
export const rootCupertino = ":root[data-stackflow-basic-ui-theme=cupertino]";

createGlobalTheme(`${root}, ${rootAndroid}`, globalVars, {
  ...defaultVars,
});
createGlobalTheme(rootCupertino, globalVars, {
  ...cupertinoVars,
});

export const [android] = createTheme(globalVars, {
  ...defaultVars,
});

export const [cupertino] = createTheme(globalVars, {
  ...cupertinoVars,
});

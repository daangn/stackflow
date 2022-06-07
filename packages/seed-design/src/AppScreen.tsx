import { useActivity } from "@stackflow/react";
import React from "react";
import { useMounted } from "utils";

import * as css from "./AppScreen.css";

interface AppScreenProps {
  children: React.ReactNode;
  theme: "Android" | "Cupertino";
}
const AppScreen: React.FC<AppScreenProps> = ({ theme, children }) => {
  const activity = useActivity();
  const { mounted } = useMounted();

  const transitionState =
    activity.transitionState === "enter-active" && !mounted
      ? undefined
      : activity.transitionState;

  return (
    <div className={css.appScreen({ theme, transitionState })}>
      <div className={css.dim} />
      <div className={css.paper}>{children}</div>
    </div>
  );
};

export default AppScreen;

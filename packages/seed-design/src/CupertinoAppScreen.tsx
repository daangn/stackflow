import { useActivity } from "@stackflow/react";
import React from "react";

import * as css from "./CupertinoAppScreen.css";
import { useMounted } from "./utils";

interface CupertinoAppScreenProps {
  children: React.ReactNode;
}
const CupertinoAppScreen: React.FC<CupertinoAppScreenProps> = ({
  children,
}) => {
  const activity = useActivity();
  const { mounted } = useMounted();

  const transitionState = (() => {
    if (activity.transitionState === "enter-active") {
      return mounted ? "enter" : "enter-active";
    }

    return activity.transitionState;
  })();

  return (
    <div
      className={css.card({
        transitionState,
      })}
    >
      {children}
    </div>
  );
};

export default CupertinoAppScreen;

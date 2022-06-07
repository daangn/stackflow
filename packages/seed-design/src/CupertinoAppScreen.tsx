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
  const { state } = useActivity();
  const { mounted } = useMounted();

  const transitionState = (() => {
    if (state.transitionState === "enter-active") {
      return mounted ? "enter" : "enter-active";
    }

    return state.transitionState;
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

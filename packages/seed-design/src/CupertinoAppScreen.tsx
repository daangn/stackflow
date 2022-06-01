import { useActivity } from "@stackflow/react";
import React from "react";

import * as css from "./CupertinoAppScreen.css";

interface CupertinoAppScreenProps {
  children: React.ReactNode;
}
const CupertinoAppScreen: React.FC<CupertinoAppScreenProps> = ({
  children,
}) => {
  const { state } = useActivity();

  return (
    <div
      className={css.card({
        transitionState: state.transitionState,
      })}
    >
      {children}
    </div>
  );
};

export default CupertinoAppScreen;

import { useActivity, useCore } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useMemo } from "react";

import * as css from "./AppScreen.css";
import { useVariant } from "./utils";

interface AppScreenProps {
  children: React.ReactNode;
  theme: "Android" | "Cupertino";
}
const AppScreen: React.FC<AppScreenProps> = ({ theme, children }) => {
  const core = useCore();
  const activity = useActivity();

  const isTop = useMemo(() => {
    const topActivity = [...core.state.activities]
      .reverse()
      .find(
        (_activity) =>
          _activity.transitionState === "enter-active" ||
          _activity.transitionState === "enter-done",
      );

    return topActivity === activity;
  }, [core.state.activities, activity]);

  const { ref } = useVariant({
    variant: activity.transitionState,
    classNames: {
      "enter-active": css.appScreenEnterActive,
      "enter-done": css.appScreenEnterDone,
      "exit-active": css.appScreenExitActive,
      "exit-done": css.appScreenExitDone,
    },
    lazy: {
      "enter-active": true,
    },
  });

  return (
    <div
      ref={ref}
      className={css.appScreen({ theme })}
      style={assignInlineVars({
        [css.vars.transitionDuration]: `${core.state.transitionDuration}ms`,
      })}
    >
      <div className={css.dim} />
      <div className={css.paper({ isTop })}>{children}</div>
    </div>
  );
};

export default AppScreen;

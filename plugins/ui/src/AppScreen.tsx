import { useActivity, useStack } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import AppBar from "AppBar";
import React, { useMemo } from "react";

import * as css from "./AppScreen.css";
import { useVariant } from "./utils";

const last = <T extends unknown>(arr: T[]) => arr[arr.length - 1];

type PropOf<T> = T extends React.ComponentType<infer U> ? U : unknown;

interface AppScreenProps {
  theme: "android" | "cupertino";
  appBar?: PropOf<typeof AppBar>;
  children: React.ReactNode;
}
const AppScreen: React.FC<AppScreenProps> = ({ theme, appBar, children }) => {
  const stack = useStack();
  const currentActivity = useActivity();

  const { ref: appScreenRef, className: appScreen } = useVariant({
    variant: currentActivity.transitionState,
    base: css.appScreen({ theme }),
    variants: {
      "enter-active": css.enterActive,
      "enter-done": css.enterDone,
      "exit-active": css.exitActive,
      "exit-done": css.exitDone,
    },
    lazy: {
      "enter-active": true,
    },
  });

  const visibleActivities = useMemo(
    () =>
      stack.activities.filter(
        (activity) =>
          activity.transitionState === "enter-active" ||
          activity.transitionState === "enter-done" ||
          activity.transitionState === "exit-active",
      ),
    [stack.activities],
  );
  const activeActivities = useMemo(
    () =>
      visibleActivities.filter(
        (activity) =>
          activity.transitionState === "enter-active" ||
          activity.transitionState === "enter-done",
      ),
    [visibleActivities],
  );

  const isActiveTop = useMemo(
    () => last(activeActivities)?.id === currentActivity.id,
    [activeActivities, currentActivity],
  );
  const isVisibleTop = useMemo(
    () => last(visibleActivities)?.id === currentActivity.id,
    [visibleActivities, currentActivity],
  );

  const zIndex = useMemo(
    () =>
      visibleActivities.findIndex(
        (activity) => activity.id === currentActivity.id,
      ),
    [visibleActivities, currentActivity],
  );

  const hasAppBar = !!appBar;

  const zIndexBase = zIndex * 4;
  const zIndexDim = zIndexBase;
  const zIndexPaper = zIndexBase + (hasAppBar ? 1 : 3);
  const zIndexAppBar = zIndexBase + 6;

  return (
    <div
      ref={appScreenRef}
      className={appScreen}
      style={assignInlineVars({
        [css.vars.zIndexes.dim]: `${zIndexDim}`,
        [css.vars.zIndexes.paper]: `${zIndexPaper}`,
        [css.vars.zIndexes.appBar]: `${zIndexAppBar}`,
        [css.vars.transitionDuration]: `${stack.transitionDuration}ms`,
      })}
    >
      <div className={css.dim} />
      <div
        className={css.paper({
          isActiveTop,
          isVisibleTop,
          hasAppBar,
        })}
      >
        {children}
      </div>
      {appBar && <AppBar {...appBar} theme={theme} />}
    </div>
  );
};

export default AppScreen;

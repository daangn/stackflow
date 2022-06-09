import { useActivity, useStack } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import { IconBack } from "assets";
import React, { useEffect, useMemo, useRef, useState } from "react";

import * as css from "./AppScreen.css";
import { useMounted, useVariant } from "./utils";

interface AppScreenProps {
  theme: "android" | "cupertino";
  appBar?: {
    title?: string;
  };
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

  const appBarRef = useRef<HTMLDivElement>(null);
  const appBarCenterRef = useRef<HTMLDivElement>(null);

  const isActivityTop = useMemo(() => {
    const topActivity = [...stack.activities]
      .reverse()
      .find(
        (activity) =>
          activity.transitionState === "enter-active" ||
          activity.transitionState === "enter-done",
      );

    return topActivity === currentActivity;
  }, [stack.activities, currentActivity]);

  const zIndex = useMemo(
    () =>
      stack.activities
        .filter(
          (activity) =>
            activity.transitionState === "enter-active" ||
            activity.transitionState === "enter-done" ||
            activity.transitionState === "exit-active",
        )
        .findIndex((activity) => activity === currentActivity),
    [stack.activities, currentActivity],
  );

  const hasAppBar = !!appBar;

  const zIndexBase = zIndex * 3;
  const zIndexPaper = zIndexBase + (hasAppBar ? 0 : 2);
  const zIndexAppBar = zIndexBase + 5;

  const [centerMainWidth, setCenterMainWidth] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (theme !== "cupertino") {
      return () => {};
    }

    const $appBar = appBarRef.current;
    const $appBarCenter = appBarCenterRef.current;

    if (!$appBar || !$appBarCenter) {
      return () => {};
    }

    const onResize = () => {
      const screenWidth = $appBar.clientWidth;

      const leftWidth = $appBarCenter.offsetLeft;
      const centerWidth = $appBarCenter.clientWidth;
      const rightWidth = screenWidth - leftWidth - centerWidth;

      const sideMargin = Math.max(leftWidth, rightWidth);

      setCenterMainWidth(screenWidth - 2 * sideMargin);
    };

    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={appScreenRef}
      className={appScreen}
      style={assignInlineVars({
        [css.vars.zIndexes.paper]: `${zIndexPaper}`,
        [css.vars.zIndexes.appBar]: `${zIndexAppBar}`,
        [css.vars.transitionDuration]: `${stack.transitionDuration}ms`,
        [css.vars.appBar.center.mainWidth]: `${centerMainWidth}px`,
      })}
    >
      <div className={css.dim} />
      <div
        className={css.paper({
          isTop: isActivityTop,
          hasAppBar,
        })}
      >
        {children}
      </div>
      {appBar && (
        <div ref={appBarRef} className={css.appBar}>
          <div className={css.appBarLeft}>
            <div className={css.appBarBackButton}>
              <IconBack />
            </div>
          </div>
          <div ref={appBarCenterRef} className={css.appBarCenter}>
            <div className={css.appBarCenterMain({ theme })}>
              <div className={css.appBarCenterMainText}>{appBar.title}</div>
            </div>
          </div>
          <div className={css.appBarRight}>right</div>
        </div>
      )}
    </div>
  );
};

export default AppScreen;

import { useActivity, useCore } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useEffect, useMemo, useRef, useState } from "react";

import * as css from "./AppScreen.css";
import { useVariant } from "./utils";

interface AppScreenProps {
  theme: "android" | "cupertino";
  appBar?: {
    title: string;
  };
  children: React.ReactNode;
}
const AppScreen: React.FC<AppScreenProps> = ({ theme, appBar, children }) => {
  const core = useCore();
  const activity = useActivity();

  const { ref } = useVariant({
    variant: activity.transitionState,
    classNames: {
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
      ref={ref}
      className={css.appScreen({ theme })}
      style={assignInlineVars({
        [css.vars.transitionDuration]: `${core.state.transitionDuration}ms`,
        [css.vars.appBar.center.mainWidth]: `${centerMainWidth}px`,
      })}
    >
      <div className={css.dim} />
      <div className={css.paper({ isTop, isAppBar: !!appBar })}>{children}</div>
      {appBar && (
        <div ref={appBarRef} className={css.appBar}>
          <div className={css.appBarLeft} />
          <div ref={appBarCenterRef} className={css.appBarCenter}>
            <div className={css.appBarCenterMain}>
              <div className={css.appBarCenterMainText}>{appBar.title}</div>
            </div>
          </div>
          <div className={css.appBarRight} />
        </div>
      )}
    </div>
  );
};

export default AppScreen;

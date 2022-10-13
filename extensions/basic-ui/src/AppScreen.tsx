import { useActions, useActivity, useStack } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useEffect, useMemo, useRef } from "react";

import AppBar from "./AppBar";
import * as css from "./AppScreen.css";
import type { PropOf } from "./utils";
import {
  compactMap,
  findBefore,
  useTopActiveActivity,
  useTopVisibleActivity,
  useVariant,
  useVisibleActivities,
} from "./utils";
import { useSwipeBack } from "./utils/useSwipeBack";

const appScreenRefMap = new Map<string, React.RefObject<any>>();
const appScreenPaperRefMap = new Map<string, React.RefObject<any>>();

interface AppScreenProps {
  theme?: "android" | "cupertino";
  appBar?: Omit<PropOf<typeof AppBar>, "theme">;
  backgroundColor?: string;
  children: React.ReactNode;
}
const AppScreen: React.FC<AppScreenProps> = ({
  theme,
  appBar,
  children,
  backgroundColor,
}) => {
  const stack = useStack();
  const actions = useActions();

  const currentActivity = useActivity();
  const visibleActivities = useVisibleActivities();
  const topVisibleActivity = useTopVisibleActivity();
  const topActiveActivity = useTopActiveActivity();

  const isTopActive = useMemo(
    () => topActiveActivity?.id === currentActivity.id,
    [topActiveActivity, currentActivity],
  );
  const isTopVisible = useMemo(
    () => topVisibleActivity?.id === currentActivity.id,
    [topVisibleActivity, currentActivity],
  );
  const isRoot = visibleActivities[0]?.id === currentActivity.id;

  const isBeforeTopVisible = useMemo(() => {
    const beforeTopVisibleActivity = findBefore(
      visibleActivities,
      (activity) => activity.id === topVisibleActivity.id,
    );
    return beforeTopVisibleActivity?.id === currentActivity.id;
  }, [visibleActivities, topVisibleActivity]);

  const dimRef = useRef<any>(null);
  const appScreenPaperRef = useRef<any>(null);
  const edgeRef = useRef<any>(null);

  const { ref: appScreenRef, className: appScreen } = useVariant({
    variant: currentActivity.transitionState,
    base: css.appScreen({
      theme,
      show: isTopVisible || isBeforeTopVisible,
    }),
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

  const beforeActivity = useMemo(
    () =>
      findBefore(
        visibleActivities,
        (activity) => activity.id === currentActivity.id,
      ),
    [visibleActivities],
  );

  useSwipeBack({
    dimRef,
    appScreenRef,
    appScreenPaperRef,
    edgeRef,
    transitionDuration: stack.transitionDuration,
    getBeforeAppScreen() {
      if (!beforeActivity) {
        return null;
      }
      return appScreenRefMap.get(beforeActivity.id)?.current;
    },
    getBeforeAppScreenPaper() {
      if (!beforeActivity) {
        return null;
      }
      return appScreenPaperRefMap.get(beforeActivity.id)?.current;
    },
    onBack() {
      actions.pop();
    },
  });

  useEffect(() => {
    if (!beforeActivity) {
      return;
    }

    const beforeAppScreen = appScreenRefMap.get(beforeActivity.id)
      ?.current as HTMLDivElement;
    const beforeAppScreenPaper = appScreenPaperRefMap.get(beforeActivity.id)
      ?.current as HTMLDivElement;

    switch (currentActivity.transitionState) {
      case "enter-done": {
        beforeAppScreen.style.display = "none";
        break;
      }
      case "exit-done":
      case "exit-active": {
        if (beforeAppScreen.style.display === "none") {
          beforeAppScreen.style.display = "block";

          switch (theme) {
            case "cupertino":
              beforeAppScreenPaper.style.transform =
                css.CUPERTINO_APP_SCREEN_PAPER_OFFSET;
              break;
            case "android":
              beforeAppScreenPaper.style.transform =
                css.ANDROID_APP_SCREEN_PAPER_OFFSET;
              break;
            default: {
              break;
            }
          }

          setTimeout(() => {
            beforeAppScreenPaper.style.transform = "";
          }, 16);
        }
        break;
      }
      default: {
        break;
      }
    }
  }, [currentActivity.transitionState]);

  useEffect(() => {
    appScreenRefMap.set(currentActivity.id, appScreenRef);
    appScreenPaperRefMap.set(currentActivity.id, appScreenPaperRef);
    return () => {
      appScreenRefMap.delete(currentActivity.id);
      appScreenPaperRefMap.delete(currentActivity.id);
    };
  }, [currentActivity, appScreenRef, appScreenPaperRef]);

  const zIndex = useMemo(
    () =>
      visibleActivities.findIndex(
        (activity) => activity.id === currentActivity.id,
      ),
    [visibleActivities, currentActivity],
  );

  const hasAppBar = !!appBar;

  const zIndexBase = zIndex * 5;
  const zIndexDim = zIndexBase;
  const zIndexPaper = zIndexBase + (theme === "cupertino" && hasAppBar ? 1 : 3);
  const zIndexEdge = zIndexBase + 4;
  const zIndexAppBar = zIndexBase + 7;

  return (
    <div
      ref={appScreenRef}
      className={appScreen}
      style={assignInlineVars(
        compactMap({
          [css.vars.backgroundColor]: backgroundColor,
          [css.vars.appBar.height]: appBar?.height,
          [css.localVars.zIndexes.dim]: `${zIndexDim}`,
          [css.localVars.zIndexes.paper]: `${zIndexPaper}`,
          [css.localVars.zIndexes.edge]: `${zIndexEdge}`,
          [css.localVars.zIndexes.appBar]: `${zIndexAppBar}`,
          [css.localVars.transitionDuration]:
            stack.globalTransitionState === "loading"
              ? `${stack.transitionDuration}ms`
              : "0ms",
        }),
      )}
    >
      <div ref={dimRef} className={css.dim} />
      <div
        key={currentActivity.id}
        ref={appScreenPaperRef}
        className={css.paper({
          offset: !isTopActive,
          hasAppBar,
        })}
      >
        {children}
      </div>
      {!isRoot && theme === "cupertino" && (
        <div ref={edgeRef} className={css.edge({ hasAppBar })} />
      )}
      {appBar && <AppBar {...appBar} theme={theme} />}
    </div>
  );
};

export default AppScreen;

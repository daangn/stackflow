import type { ActivityTransitionState } from "@stackflow/core";
import { useActions, useActivity, useStack } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useEffect, useMemo, useRef } from "react";
import { match, P } from "ts-pattern";

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
const paperRefMap = new Map<string, React.RefObject<any>>();
const appBarRefMap = new Map<string, React.RefObject<any>>();

interface AppScreenProps {
  theme?: "android" | "cupertino";
  appBar?: Omit<PropOf<typeof AppBar>, "theme" | "ref">;
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
  const paperRef = useRef<any>(null);
  const edgeRef = useRef<any>(null);
  const appBarRef = useRef<any>(null);

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
    paperRef,
    edgeRef,
    transitionDuration: stack.transitionDuration,
    getBeforeAppScreen() {
      if (!beforeActivity) {
        return null;
      }
      return appScreenRefMap.get(beforeActivity.id)?.current;
    },
    getBeforePaper() {
      if (!beforeActivity) {
        return null;
      }
      return paperRefMap.get(beforeActivity.id)?.current;
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
    const beforePaper = paperRefMap.get(beforeActivity.id)
      ?.current as HTMLDivElement;
    const beforeAppBar = appBarRefMap.get(beforeActivity.id)
      ?.current as HTMLDivElement;

    match<
      [ActivityTransitionState, string, "android" | "cupertino" | undefined]
    >([currentActivity.transitionState, beforeAppScreen.style.display, theme])
      .with(["enter-done", P._, P._], () => {
        beforeAppScreen.style.display = "none";
      })
      .with([P.union("exit-done", "exit-active"), "none", "cupertino"], () => {
        beforeAppScreen.style.display = "block";
        beforePaper.style.transform = css.CUPERTINO_APP_SCREEN_PAPER_OFFSET;

        setTimeout(() => {
          beforePaper.style.transform = "";
        }, 16);
      })
      .with([P.union("exit-done", "exit-active"), "none", "android"], () => {
        beforeAppScreen.style.display = "block";
        beforePaper.style.transform = css.ANDROID_APP_SCREEN_PAPER_OFFSET;
        beforeAppBar.style.transform = css.ANDROID_APP_SCREEN_PAPER_OFFSET;

        setTimeout(() => {
          beforePaper.style.transform = "";
          beforeAppBar.style.transform = "";
        }, 16);
      })
      .with([P._, P._, P._], () => {})
      .exhaustive();
  }, [currentActivity.transitionState]);

  useEffect(() => {
    appScreenRefMap.set(currentActivity.id, appScreenRef);
    paperRefMap.set(currentActivity.id, paperRef);
    appBarRefMap.set(currentActivity.id, appBarRef);

    return () => {
      appScreenRefMap.delete(currentActivity.id);
      paperRefMap.delete(currentActivity.id);
      appBarRefMap.delete(currentActivity.id);
    };
  }, [currentActivity, appScreenRef, paperRef, appBarRef]);

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
        ref={paperRef}
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
      {appBar && <AppBar {...appBar} theme={theme} ref={appBarRef} />}
    </div>
  );
};

export default AppScreen;

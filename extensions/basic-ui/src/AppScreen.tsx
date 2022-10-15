import { useActivity, useStack } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useEffect, useMemo, useRef } from "react";

import AppBar from "./AppBar";
import * as css from "./AppScreen.css";
import type { PropOf } from "./utils";
import {
  compactMap,
  findBefore,
  useTopVisibleActivity,
  useVariant,
  useVisibleActivities,
} from "./utils";

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

  const currentActivity = useActivity();
  const visibleActivities = useVisibleActivities();
  const topVisibleActivity = useTopVisibleActivity();

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

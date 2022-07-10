import { useActions, useActivity, useStack } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useEffect, useMemo } from "react";

import AppBar from "./AppBar";
import * as css from "./AppScreen.css";
import {
  compactMap,
  findBefore,
  useTopActiveActivity,
  useTopVisibleActivity,
  useVariant,
  useVisibleActivities,
} from "./utils";
import { useSwipeBack } from "./utils/useSwipeBack";

type PropOf<T> = T extends React.ComponentType<infer U> ? U : unknown;

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

  const { ref: appScreenRef, className: appScreen } = useVariant({
    variant: currentActivity.transitionState,
    base: css.appScreen({
      theme,
      show: isTopVisible || isBeforeTopVisible || isTopActive,
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

  const { dimRef, paperRef, edgeRef } = useSwipeBack({
    transitionDuration: stack.transitionDuration,
    getBeforePaper() {
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
    appScreenPaperRefMap.set(currentActivity.id, paperRef);
    return () => {
      appScreenPaperRefMap.delete(currentActivity.id);
    };
  }, [currentActivity, paperRef]);

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
  const zIndexPaper = zIndexBase + (theme === "cupertino" && hasAppBar ? 1 : 3);
  const zIndexAppBar = zIndexBase + 6;

  return (
    <div
      ref={appScreenRef}
      className={appScreen}
      style={assignInlineVars(
        compactMap({
          [css.vars.backgroundColor]: backgroundColor,
          [css.localVars.zIndexes.dim]: `${zIndexDim}`,
          [css.localVars.zIndexes.paper]: `${zIndexPaper}`,
          [css.localVars.zIndexes.appBar]: `${zIndexAppBar}`,
          [css.localVars.transitionDuration]: stack.globalTransitionState === 'loading' ? `${stack.transitionDuration}ms` : '0ms',
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
        {!isRoot && theme === "cupertino" && (
          <div ref={edgeRef} className={css.edge({ hasAppBar })} />
        )}
      </div>
      {appBar && <AppBar {...appBar} theme={theme} />}
    </div>
  );
};

export default AppScreen;

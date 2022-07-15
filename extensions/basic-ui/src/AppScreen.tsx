import { useActions, useActivity, useStack } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useEffect, useMemo, useRef } from "react";

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
  useBodyScroll?: boolean;
  children: React.ReactNode;
}
const AppScreen: React.FC<AppScreenProps> = ({
  theme,
  appBar,
  backgroundColor,
  useBodyScroll,
  children,
}) => {
  const stack = useStack();
  const actions = useActions();
  const scrollTopRef = useRef(0);

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

  const { dimRef, paperRef, edgeRef } = useSwipeBack<HTMLDivElement>({
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

  const bodyScroll =
    !!useBodyScroll &&
    currentActivity.transitionState === "enter-done" &&
    isTopActive;

  useEffect(() => {
    const $paper = paperRef.current;

    if (!$paper) {
      return;
    }

    if (bodyScroll) {
      $paper.style.cssText = `overflow: visible;`;
      window.scroll({ top: scrollTopRef.current });
    } else {
      $paper.style.cssText = ``;
      $paper.scroll({ top: scrollTopRef.current });
    }
  }, [paperRef, bodyScroll, scrollTopRef]);

  useEffect(() => {
    const $paper = paperRef.current;

    if (!$paper) {
      return () => {};
    }

    const onWindowScroll = () => {
      scrollTopRef.current = window.scrollY;
    };
    const onPaperScroll = () => {
      scrollTopRef.current = $paper.scrollTop;
    };

    $paper.addEventListener("scroll", onPaperScroll);
    window.addEventListener("scroll", onWindowScroll);

    return () => {
      $paper.removeEventListener("scroll", onPaperScroll);
      window.removeEventListener("scroll", onWindowScroll);
    };
  }, [paperRef, scrollTopRef]);

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
        <div
          ref={edgeRef}
          className={css.edge({
            hasAppBar,
            useFixed: bodyScroll,
          })}
        />
      )}
      {appBar && <AppBar {...appBar} theme={theme} useFixed={bodyScroll} />}
    </div>
  );
};

export default AppScreen;

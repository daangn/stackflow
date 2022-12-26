/* eslint-disable no-param-reassign */

import { useActions } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { createContext, useContext, useMemo, useRef } from "react";

import { useGlobalOptions } from "../basicUIPlugin";
import {
  useLazy,
  useNullableActivity,
  useStyleEffectHide,
  useStyleEffectOffset,
  useStyleEffectSwipeBack,
} from "../hooks";
import type { GlobalVars } from "../theme.css";
import { globalVars } from "../theme.css";
import type { PropOf } from "../utils";
import { compactMap } from "../utils";
import AppBar from "./AppBar";
import * as css from "./AppScreen.css";

export type AppScreenContext = {
  scroll: (args: { top: number }) => void;
};
const Context = createContext<AppScreenContext>(null as any);

export function useAppScreen() {
  return useContext(Context);
}

export type AppScreenProps = Partial<
  Pick<GlobalVars, "backgroundColor" | "dimBackgroundColor">
> & {
  appBar?: Omit<PropOf<typeof AppBar>, "theme" | "ref" | "key">;
  preventSwipeBack?: boolean;
  children: React.ReactNode;
};
const AppScreen: React.FC<AppScreenProps> = ({
  backgroundColor,
  dimBackgroundColor,
  appBar,
  preventSwipeBack,
  children,
}) => {
  const globalOptions = useGlobalOptions();
  const activity = useNullableActivity();
  const { pop } = useActions();

  const appScreenRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const appBarRef = useRef<HTMLDivElement>(null);

  useStyleEffectHide({
    refs: [appScreenRef],
    hasEffect: true,
  });
  useStyleEffectOffset({
    theme: globalOptions.theme,
    refs:
      globalOptions.theme === "cupertino" ? [paperRef] : [paperRef, appBarRef],
    hasEffect: true,
  });
  useStyleEffectSwipeBack({
    theme: globalOptions.theme,
    dimRef,
    edgeRef,
    paperRef,
    hasEffect: true,
    onSwiped() {
      pop();
    },
  });

  const hasAppBar = !!appBar;

  const zIndexBase = (activity?.zIndex ?? 0) * 5;
  const zIndexDim = zIndexBase;
  const zIndexPaper =
    zIndexBase + (globalOptions.theme === "cupertino" && hasAppBar ? 1 : 3);
  const zIndexEdge = zIndexBase + 4;
  const zIndexAppBar = zIndexBase + 7;

  const transitionState = activity?.transitionState ?? "enter-done";
  const lazyTransitionState = useLazy(transitionState);

  const onAppBarTopClick: React.MouseEventHandler = (e) => {
    appBar?.onTopClick?.(e);

    if (!e.defaultPrevented) {
      paperRef.current?.scroll({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <Context.Provider
      value={useMemo(
        () => ({
          scroll({ top }) {
            paperRef?.current?.scroll({
              top,
              behavior: "smooth",
            });
          },
        }),
        [paperRef],
      )}
    >
      <div
        ref={appScreenRef}
        className={css.appScreen({
          transitionState:
            transitionState === "enter-done" || transitionState === "exit-done"
              ? transitionState
              : lazyTransitionState,
        })}
        style={assignInlineVars(
          compactMap({
            [globalVars.backgroundColor]: backgroundColor,
            [globalVars.dimBackgroundColor]: dimBackgroundColor,
            [globalVars.appBar.height]: appBar?.height,
            [globalVars.appBar.heightTransitionDuration]:
              appBar?.heightTransitionDuration,
            [css.vars.zIndexes.dim]: `${zIndexDim}`,
            [css.vars.zIndexes.paper]: `${zIndexPaper}`,
            [css.vars.zIndexes.edge]: `${zIndexEdge}`,
            [css.vars.zIndexes.appBar]: `${zIndexAppBar}`,
            [css.vars.transitionDuration]:
              transitionState === "enter-active" ||
              transitionState === "exit-active"
                ? `var(--stackflow-transition-duration)`
                : "0ms",
          }),
        )}
      >
        <div className={css.dim} ref={dimRef} />
        <div
          key={activity?.id}
          className={css.paper({
            hasAppBar,
          })}
          ref={paperRef}
        >
          {children}
        </div>
        {!activity?.isRoot &&
          globalOptions.theme === "cupertino" &&
          !preventSwipeBack && (
            <div className={css.edge({ hasAppBar })} ref={edgeRef} />
          )}
        {appBar && (
          <AppBar {...appBar} ref={appBarRef} onTopClick={onAppBarTopClick} />
        )}
      </div>
    </Context.Provider>
  );
};

AppScreen.displayName = "AppScreen";

export default AppScreen;

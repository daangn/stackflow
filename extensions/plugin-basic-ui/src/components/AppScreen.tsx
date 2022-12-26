/* eslint-disable no-param-reassign */

import { useActions } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useRef } from "react";

import { useGlobalOptions } from "../basicUIPlugin";
import {
  useForwardedRef,
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

type AppScreenProps = Partial<
  Pick<GlobalVars, "backgroundColor" | "dimBackgroundColor">
> & {
  appBar?: Omit<PropOf<typeof AppBar>, "theme" | "ref" | "key">;
  preventSwipeBack?: boolean;
  scrollElementRef?: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
};
const AppScreen = React.forwardRef<HTMLDivElement, AppScreenProps>(
  (props, ref) => {
    const globalOptions = useGlobalOptions();
    const activity = useNullableActivity();
    const { pop } = useActions();

    const containerRef = useRef<HTMLDivElement>(null);
    const dimRef = useRef<HTMLDivElement>(null);
    const edgeRef = useRef<HTMLDivElement>(null);
    const appBarRef = useRef<HTMLDivElement>(null);

    const mainRef = useForwardedRef(ref);

    useStyleEffectHide({
      refs: [containerRef],
      hasEffect: true,
    });
    useStyleEffectOffset({
      theme: globalOptions.theme,
      refs:
        globalOptions.theme === "cupertino" ? [mainRef] : [mainRef, appBarRef],
      hasEffect: true,
    });
    useStyleEffectSwipeBack({
      theme: globalOptions.theme,
      dimRef,
      edgeRef,
      mainRef,
      hasEffect: true,
      onSwiped() {
        pop();
      },
    });

    const hasAppBar = !!props.appBar;

    const zIndexBase = (activity?.zIndex ?? 0) * 5;
    const zIndexDim = zIndexBase;
    const zIndexPaper =
      zIndexBase + (globalOptions.theme === "cupertino" && hasAppBar ? 1 : 3);
    const zIndexEdge = zIndexBase + 4;
    const zIndexAppBar = zIndexBase + 7;

    const transitionState = activity?.transitionState ?? "enter-done";
    const lazyTransitionState = useLazy(transitionState);

    const onAppBarTopClick: React.MouseEventHandler = (e) => {
      props.appBar?.onTopClick?.(e);

      if (!e.defaultPrevented) {
        mainRef?.current?.scroll({
          top: 0,
          behavior: "smooth",
        });
      }
    };

    return (
      <div
        ref={containerRef}
        className={css.container({
          transitionState:
            transitionState === "enter-done" || transitionState === "exit-done"
              ? transitionState
              : lazyTransitionState,
        })}
        style={assignInlineVars(
          compactMap({
            [globalVars.backgroundColor]: props.backgroundColor,
            [globalVars.dimBackgroundColor]: props.dimBackgroundColor,
            [globalVars.appBar.height]: props.appBar?.height,
            [globalVars.appBar.heightTransitionDuration]:
              props.appBar?.heightTransitionDuration,
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
          className={css.main({
            hasAppBar,
          })}
          ref={mainRef}
        >
          {props.children}
        </div>
        {!activity?.isRoot &&
          globalOptions.theme === "cupertino" &&
          !props.preventSwipeBack && (
            <div className={css.edge({ hasAppBar })} ref={edgeRef} />
          )}
        {props.appBar && (
          <AppBar
            {...props.appBar}
            ref={appBarRef}
            onTopClick={onAppBarTopClick}
          />
        )}
      </div>
    );
  },
);

AppScreen.displayName = "AppScreen";

export default AppScreen;

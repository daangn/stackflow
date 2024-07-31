/* @jsxImportSource solid-js */

import { useActions, useActivity } from "@stackflow/solid";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import type { Component, JSXElement } from "solid-js";
import { createContext, createMemo, useContext } from "solid-js";

import type { GlobalVars } from "../../common/basicUIPlugin.css";
import { globalVars } from "../../common/basicUIPlugin.css";
import * as css from "../../common/components/AppScreen.css";
import type { PropOf } from "../../common/utils";
import { compactMap } from "../../common/utils";
import { useGlobalOptions } from "../basicUIPlugin.solid";
import {
  createLazy,
  createStyleEffectHide,
  createStyleEffectOffset,
  createStyleEffectSwipeBack,
  createZIndexBase,
  useMounted,
} from "../primitives";
import AppBar from "./AppBar.solid";

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
  appBar?: Omit<
    PropOf<typeof AppBar>,
    "theme" | "modalPresentationStyle" | "ref" | "key"
  >;
  preventSwipeBack?: boolean;
  CUPERTINO_ONLY_modalPresentationStyle?: "fullScreen";
  ANDROID_ONLY_activityEnterStyle?: "slideInLeft";
  children: JSXElement;
};
const AppScreen: Component<AppScreenProps> = (props) => {
  const globalOptions = useGlobalOptions();
  const activity = useActivity();
  const mounted = useMounted();

  const { pop } = useActions();

  let appScreenRef: HTMLDivElement | undefined;
  let dimRef: HTMLDivElement | undefined;
  let paperRef: HTMLDivElement | undefined;
  let edgeRef: HTMLDivElement | undefined;
  let appBarRef: HTMLDivElement | undefined;

  const modalPresentationStyle =
    globalOptions.theme === "cupertino"
      ? () => props.CUPERTINO_ONLY_modalPresentationStyle
      : undefined;
  const activityEnterStyle =
    globalOptions.theme === "android"
      ? () => props.ANDROID_ONLY_activityEnterStyle
      : undefined;

  const swipeBackPrevented = createMemo(
    () => props.preventSwipeBack || modalPresentationStyle?.() === "fullScreen",
  );

  const hasAppBar = createMemo(() => !!props.appBar);

  const zIndexBase = createZIndexBase();

  const { zIndexDim, zIndexPaper, zIndexEdge, zIndexAppBar } = (() => {
    switch (globalOptions.theme) {
      case "cupertino":
        return {
          zIndexDim: createMemo(
            () =>
              zIndexBase() +
              (modalPresentationStyle?.() === "fullScreen" ? 2 : 0),
          ),
          zIndexPaper: createMemo(
            () =>
              zIndexBase() +
              (hasAppBar() && modalPresentationStyle?.() !== "fullScreen"
                ? 1
                : 3),
          ),
          zIndexEdge: () => zIndexBase() + 4,
          zIndexAppBar: () => zIndexBase() + 7,
        };
      default:
        return {
          zIndexDim: () => zIndexBase(),
          zIndexPaper: createMemo(
            () =>
              zIndexBase() + (activityEnterStyle?.() === "slideInLeft" ? 1 : 3),
          ),
          zIndexEdge: () => zIndexBase() + 4,
          zIndexAppBar: createMemo(
            () =>
              zIndexBase() + (activityEnterStyle?.() === "slideInLeft" ? 7 : 4),
          ),
        };
    }
  })();

  const transitionState = createMemo(
    () => activity()?.transitionState ?? "enter-done",
  );
  const lazyTransitionState = createLazy(transitionState);

  createStyleEffectHide({
    refs: [() => appScreenRef],
    hasEffect: true,
  });
  createStyleEffectOffset({
    refs:
      globalOptions.theme === "cupertino" ||
      activityEnterStyle?.() === "slideInLeft"
        ? [() => paperRef]
        : [() => paperRef, () => appBarRef],
    theme: globalOptions.theme,
    activityEnterStyle: activityEnterStyle?.(),
    hasEffect: modalPresentationStyle?.() !== "fullScreen",
  });
  createStyleEffectSwipeBack({
    dimRef: () => dimRef,
    edgeRef: () => edgeRef,
    paperRef: () => paperRef,
    theme: globalOptions.theme,
    prevented: swipeBackPrevented,
    onSwiped() {
      pop();
    },
    hasEffect: true,
  });

  const onAppBarTopClick = (e: MouseEvent) => {
    props.appBar?.onTopClick?.(e);

    if (!e.defaultPrevented) {
      paperRef?.scroll({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <Context.Provider
      value={{
        scroll({ top }) {
          paperRef?.scroll({
            top,
            behavior: "smooth",
          });
        },
      }}
    >
      <div
        ref={appScreenRef}
        class={css.appScreen({
          transitionState:
            transitionState() === "enter-done" ||
            transitionState() === "exit-done"
              ? transitionState()
              : lazyTransitionState(),
        })}
        style={assignInlineVars(
          compactMap({
            [globalVars.backgroundColor]: props.backgroundColor,
            [globalVars.dimBackgroundColor]: props.dimBackgroundColor,
            [globalVars.appBar.height]: props.appBar?.height,
            [globalVars.appBar.heightTransitionDuration]:
              props.appBar?.heightTransitionDuration,
            [css.vars.zIndexes.dim]: `${zIndexDim()}`,
            [css.vars.zIndexes.paper]: `${zIndexPaper()}`,
            [css.vars.zIndexes.edge]: `${zIndexEdge()}`,
            [css.vars.zIndexes.appBar]: `${zIndexAppBar()}`,
            [css.vars.transitionDuration]:
              transitionState() === "enter-active" ||
              transitionState() === "exit-active"
                ? globalVars.computedTransitionDuration
                : "0ms",
          }),
        )}
        data-stackflow-component-name="AppScreen"
        data-stackflow-activity-id={mounted() ? activity()?.id : undefined}
        data-stackflow-activity-is-active={
          mounted() ? activity()?.isActive : undefined
        }
      >
        {activityEnterStyle?.() !== "slideInLeft" && (
          <div class={css.dim} ref={dimRef} />
        )}
        {props.appBar && (
          <AppBar
            {...props.appBar}
            ref={appBarRef}
            modalPresentationStyle={modalPresentationStyle?.()}
            activityEnterStyle={activityEnterStyle?.()}
            onTopClick={onAppBarTopClick}
          />
        )}
        <div
          class={css.paper({
            hasAppBar: hasAppBar(),
            modalPresentationStyle: modalPresentationStyle?.(),
            activityEnterStyle: activityEnterStyle?.(),
          })}
          ref={paperRef}
        >
          {props.children}
        </div>
        {!activity()?.isRoot &&
          globalOptions.theme === "cupertino" &&
          !swipeBackPrevented && (
            <div class={css.edge({ hasAppBar: hasAppBar() })} ref={edgeRef} />
          )}
      </div>
    </Context.Provider>
  );
};

export default AppScreen;

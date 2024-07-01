/* @jsxImportSource solid-js */

import { useActions, useActivity } from "@stackflow/solid";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import type { JSXElement } from "solid-js";
import { Match, Show, Switch, createMemo, mergeProps } from "solid-js";

import { useAppBarTitleMaxWidth } from "@stackflow/solid-ui-core";
import { IconBack, IconClose } from "../../common/assets";
import type { GlobalVars } from "../../common/basicUIPlugin.css";
import { globalVars } from "../../common/basicUIPlugin.css";
import { useGlobalOptions } from "../basicUIPlugin.solid";

import * as css from "../../common/components/AppBar.css";
import * as appScreenCss from "../../common/components/AppScreen.css";
import { compactMap } from "../../common/utils";

type AppBarProps = Partial<
  Pick<
    GlobalVars["appBar"],
    | "borderColor"
    | "borderColorTransitionDuration"
    | "borderSize"
    | "height"
    | "heightTransitionDuration"
    | "overflow"
    | "iconColor"
    | "iconColorTransitionDuration"
    | "textColor"
    | "textColorTransitionDuration"
    | "backgroundColor"
    | "backgroundColorTransitionDuration"
  >
> & {
  ref?: HTMLDivElement;
  title?: JSXElement;
  renderLeft?: () => JSXElement;
  renderRight?: () => JSXElement;
  backButton?:
    | {
        renderIcon?: () => JSXElement;
        ariaLabel?: string;
        onClick?: (e: MouseEvent) => void;
      }
    | {
        render?: () => JSXElement;
      };
  closeButton?:
    | {
        renderIcon?: () => JSXElement;
        ariaLabel?: string;
        onClick?: (e: MouseEvent) => void;
      }
    | {
        render?: () => JSXElement;
      };
  closeButtonLocation?: "left" | "right";
  border?: boolean;
  modalPresentationStyle?: "fullScreen";
  activityEnterStyle?: "slideInLeft";
  onTopClick?: (e: MouseEvent) => void;
};
const AppBar = (_props: AppBarProps) => {
  const props = mergeProps(_props, {
    closeButtonLocation: "left",
    border: true,
  });
  const actions = useActions();
  const activity = useActivity();

  const globalOptions = useGlobalOptions();
  const globalCloseButton = globalOptions.appBar?.closeButton;
  const globalBackButton = globalOptions.appBar?.backButton;

  let centerRef: HTMLDivElement | undefined;

  const { maxWidth } = useAppBarTitleMaxWidth({
    outerRef: props.ref,
    innerRef: centerRef,
    enable: globalOptions.theme === "cupertino",
  });

  const onBackClick = (e: MouseEvent) => {
    if (
      props.backButton &&
      "onClick" in props.backButton &&
      props.backButton.onClick
    ) {
      props.backButton.onClick(e);
    }

    if (!e.defaultPrevented) {
      actions.pop();
    }
  };

  const BackButton = () => (
    <Show when={activity() && !activity()?.isRoot}>
      <Switch
        fallback={
          <button
            type="button"
            class={css.backButton}
            onClick={onBackClick}
            innerHTML={IconBack()}
          />
        }
      >
        <Match
          when={
            props.backButton &&
            "render" in props.backButton &&
            props.backButton.render
          }
        >
          {(render) => render()()}
        </Match>
        <Match
          when={
            globalBackButton &&
            "render" in globalBackButton &&
            globalBackButton.render
          }
        >
          {(render) => render()()}
        </Match>
        <Match when={props.backButton || globalBackButton}>
          <button
            type="button"
            class={css.backButton}
            aria-label={
              props.backButton && "ariaLabel" in props.backButton
                ? props.backButton.ariaLabel
                : globalBackButton && "ariaLabel" in globalBackButton
                  ? globalBackButton.ariaLabel
                  : undefined
            }
            onClick={onBackClick}
          >
            <Switch fallback={<div innerHTML={IconBack()} />}>
              <Match
                when={
                  props.backButton &&
                  "renderIcon" in props.backButton &&
                  props.backButton.renderIcon
                }
              >
                {(render) => render()()}
              </Match>
              <Match
                when={
                  globalBackButton &&
                  "renderIcon" in globalBackButton &&
                  globalBackButton.renderIcon
                }
              >
                {(render) => render()()}
              </Match>
              <Match when={props.modalPresentationStyle === "fullScreen"}>
                <div innerHTML={IconClose()} />
              </Match>
            </Switch>
          </button>
        </Match>
      </Switch>
    </Show>
  );

  const onCloseClick = (e: MouseEvent) => {
    if (
      props.closeButton &&
      "onClick" in props.closeButton &&
      props.closeButton.onClick
    ) {
      props.closeButton.onClick(e);
    }

    if (
      !e.defaultPrevented &&
      globalCloseButton &&
      "onClick" in globalCloseButton
    ) {
      globalCloseButton.onClick?.(e);
    }
  };

  const CloseButton = () => {
    const isRoot = createMemo(() => !activity() || !!activity()?.isRoot);

    const showCloseButton = (closeButton: AppBarProps["closeButton"]) =>
      (closeButton && "render" in closeButton && closeButton.render) ||
      (closeButton && "renderIcon" in closeButton && closeButton.renderIcon) ||
      (closeButton && "onClick" in closeButton && closeButton.onClick);

    return (
      <Show
        when={
          (showCloseButton(props.closeButton) ||
            showCloseButton(globalOptions.appBar?.closeButton)) &&
          isRoot()
        }
      >
        <Switch>
          <Match
            when={
              props.closeButton &&
              "render" in props.closeButton &&
              props.closeButton.render
            }
          >
            {(render) => render()()}
          </Match>
          <Match
            when={
              globalOptions.appBar?.closeButton &&
              "render" in globalOptions.appBar.closeButton &&
              globalOptions.appBar.closeButton.render
            }
          >
            {(render) => render()()}
          </Match>
          <Match when={true}>
            <button
              type="button"
              class={css.closeButton}
              aria-label={
                props.closeButton && "ariaLabel" in props.closeButton
                  ? props.closeButton.ariaLabel
                  : globalCloseButton && "ariaLabel" in globalCloseButton
                    ? globalCloseButton.ariaLabel
                    : undefined
              }
              onClick={onCloseClick}
            >
              <Switch fallback={<div innerHTML={IconClose()} />}>
                <Match
                  when={
                    props.closeButton &&
                    "renderIcon" in props.closeButton &&
                    props.closeButton.renderIcon
                  }
                >
                  {(render) => render()()}
                </Match>
                <Match
                  when={
                    globalOptions.appBar?.closeButton &&
                    "renderIcon" in globalOptions.appBar.closeButton &&
                    globalOptions.appBar.closeButton.renderIcon
                  }
                >
                  {(render) => render()()}
                </Match>
              </Switch>
            </button>
          </Match>
        </Switch>
      </Show>
    );
  };

  const hasLeft = createMemo(
    () =>
      !!(
        (props.closeButtonLocation === "left" && props.closeButton) ||
        props.backButton ||
        props.renderLeft
      ),
  );

  const closeButton = <CloseButton />;

  return (
    <div
      ref={props.ref}
      class={css.appBar({
        border: props.border,
        modalPresentationStyle: props.modalPresentationStyle,
        activityEnterStyle: props.activityEnterStyle,
      })}
      style={assignInlineVars(
        compactMap({
          [globalVars.appBar.iconColor]: props.iconColor,
          [globalVars.appBar.iconColorTransitionDuration]:
            props.iconColorTransitionDuration,
          [globalVars.appBar.textColor]: props.textColor,
          [globalVars.appBar.textColorTransitionDuration]:
            props.textColorTransitionDuration,
          [globalVars.appBar.borderColor]: props.borderColor,
          [globalVars.appBar.borderColorTransitionDuration]:
            props.borderColorTransitionDuration,
          [globalVars.appBar.borderSize]: props.borderSize,
          [globalVars.appBar.height]: props.height,
          [globalVars.appBar.heightTransitionDuration]:
            props.heightTransitionDuration,
          [globalVars.appBar.overflow]: props.overflow,
          [globalVars.appBar.backgroundColor]:
            props.backgroundColor || globalVars.backgroundColor,
          [globalVars.appBar.backgroundColorTransitionDuration]:
            props.backgroundColorTransitionDuration,
          [appScreenCss.vars.appBar.center.mainWidth]: `${maxWidth()}px`,
        }),
      )}
    >
      <div class={css.safeArea} />
      <div class={css.container}>
        <div class={css.left}>
          <Show when={props.closeButtonLocation === "left"}>{closeButton}</Show>
          <BackButton />
          {props.renderLeft?.()}
        </div>
        <div ref={centerRef} class={css.center}>
          <div
            class={css.centerMain({
              hasLeft: hasLeft(),
            })}
          >
            <Show when={typeof props.title === "string"} fallback={props.title}>
              <div class={css.centerText}>{props.title}</div>
            </Show>
            <button
              class={css.centerMainEdge}
              type="button"
              onClick={props.onTopClick}
            />
          </div>
        </div>
        <div class={css.right}>
          {props.renderRight?.()}
          <Show when={props.closeButtonLocation === "right"}>
            {closeButton}
          </Show>
        </div>
      </div>
    </div>
  );
};

export default AppBar;

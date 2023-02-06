import { useActions } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import { forwardRef, useRef } from "react";

import { IconBack, IconClose } from "../assets";
import { useGlobalOptions } from "../basicUIPlugin";
import { useMaxWidth, useNullableActivity } from "../hooks";
import type { GlobalVars } from "../theme.css";
import { globalVars } from "../theme.css";
import { compactMap } from "../utils";
import * as css from "./AppBar.css";
import * as appScreenCss from "./AppScreen.css";

type AppBarProps = Partial<
  Pick<
    GlobalVars["appBar"],
    | "borderColor"
    | "borderSize"
    | "height"
    | "heightTransitionDuration"
    | "overflow"
    | "iconColor"
    | "textColor"
    | "backgroundColor"
  >
> & {
  title?: React.ReactNode;
  appendLeft?: () => React.ReactNode;
  appendRight?: () => React.ReactNode;
  backButton?:
    | {
        renderIcon?: () => React.ReactNode;
        ariaLabel?: string;
        onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
      }
    | {
        render?: () => React.ReactNode;
      };
  closeButton?:
    | {
        renderIcon?: () => React.ReactNode;
        ariaLabel?: string;
        onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
      }
    | {
        render?: () => React.ReactNode;
      };
  closeButtonLocation?: "left" | "right";
  border?: boolean;
  modalPresentationStyle?: "fullScreen";
  onTopClick?: (e: React.MouseEvent) => void;
};
const AppBar = forwardRef<HTMLDivElement, AppBarProps>(
  (
    {
      title,
      appendLeft,
      appendRight,
      backButton,
      closeButton,
      closeButtonLocation = "left",
      border = true,
      modalPresentationStyle,
      iconColor,
      textColor,
      borderColor,
      borderSize,
      height,
      heightTransitionDuration,
      overflow,
      backgroundColor,
      onTopClick,
    },
    ref,
  ) => {
    const actions = useActions();
    const activity = useNullableActivity();

    const globalOptions = useGlobalOptions();
    const globalCloseButton = globalOptions.appBar?.closeButton;
    const globalBackButton = globalOptions.appBar?.backButton;

    const centerRef = useRef<any>(null);

    const { maxWidth } = useMaxWidth({
      outerRef: ref,
      innerRef: centerRef,
      enable: globalOptions.theme === "cupertino",
    });

    const presentModalFullScreen = modalPresentationStyle === "fullScreen";

    const onBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (backButton && "onClick" in backButton && backButton.onClick) {
        backButton.onClick(e);
      }

      if (!e.defaultPrevented) {
        actions.pop();
      }
    };

    const renderBackButton = () => {
      if (!activity) {
        return null;
      }
      if (activity.isRoot) {
        return null;
      }

      if (!backButton && !globalBackButton) {
        return (
          <button
            type="button"
            className={css.backButton}
            onClick={onBackClick}
          >
            <IconBack />
          </button>
        );
      }

      if (backButton && "render" in backButton && backButton.render) {
        return backButton.render?.();
      }
      if (
        globalBackButton &&
        "render" in globalBackButton &&
        globalBackButton.render
      ) {
        return globalBackButton.render?.();
      }

      return (
        <button
          type="button"
          className={css.backButton}
          aria-label={
            backButton && "ariaLabel" in backButton
              ? backButton.ariaLabel
              : globalBackButton && "ariaLabel" in globalBackButton
              ? globalBackButton.ariaLabel
              : undefined
          }
          onClick={onBackClick}
        >
          {(() => {
            if (
              backButton &&
              "renderIcon" in backButton &&
              backButton.renderIcon
            ) {
              return backButton.renderIcon();
            }
            if (
              globalBackButton &&
              "renderIcon" in globalBackButton &&
              globalBackButton.renderIcon
            ) {
              return globalBackButton.renderIcon();
            }

            if (presentModalFullScreen) {
              return <IconClose />;
            }

            return <IconBack />;
          })()}
        </button>
      );
    };

    const onCloseClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (closeButton && "onClick" in closeButton && closeButton.onClick) {
        closeButton.onClick(e);
      }

      if (
        !e.defaultPrevented &&
        globalCloseButton &&
        "onClick" in globalCloseButton
      ) {
        globalCloseButton.onClick?.(e);
      }
    };

    const renderCloseButton = () => {
      const isRoot = !activity || activity.isRoot;

      const showCloseButton = (closeButton: AppBarProps["closeButton"]) =>
        (closeButton && "render" in closeButton && closeButton.render) ||
        (closeButton &&
          "renderIcon" in closeButton &&
          closeButton.renderIcon) ||
        (closeButton && "onClick" in closeButton && closeButton.onClick);

      if (
        !(
          showCloseButton(closeButton) ||
          showCloseButton(globalOptions.appBar?.closeButton)
        ) ||
        !isRoot
      ) {
        return null;
      }
      if (closeButton && "render" in closeButton && closeButton.render) {
        return closeButton.render();
      }
      if (
        globalCloseButton &&
        "render" in globalCloseButton &&
        globalCloseButton.render
      ) {
        return globalCloseButton.render();
      }

      return (
        <button
          type="button"
          className={css.closeButton}
          aria-label={
            closeButton && "ariaLabel" in closeButton
              ? closeButton.ariaLabel
              : globalCloseButton && "ariaLabel" in globalCloseButton
              ? globalCloseButton.ariaLabel
              : undefined
          }
          onClick={onCloseClick}
        >
          {(() => {
            if (
              closeButton &&
              "renderIcon" in closeButton &&
              closeButton.renderIcon
            ) {
              return closeButton.renderIcon();
            }
            if (
              globalCloseButton &&
              "renderIcon" in globalCloseButton &&
              globalCloseButton.renderIcon
            ) {
              return globalCloseButton.renderIcon();
            }

            return <IconClose />;
          })()}
        </button>
      );
    };

    const hasLeft = !!(
      (closeButtonLocation === "left" && closeButton) ||
      backButton ||
      appendLeft
    );

    return (
      <div
        ref={ref}
        className={css.appBar({
          border,
          presentModalFullScreen,
        })}
        style={assignInlineVars(
          compactMap({
            [globalVars.appBar.iconColor]: iconColor,
            [globalVars.appBar.textColor]: textColor,
            [globalVars.appBar.borderColor]: borderColor,
            [globalVars.appBar.borderSize]: borderSize,
            [globalVars.appBar.height]: height,
            [globalVars.appBar.heightTransitionDuration]:
              heightTransitionDuration,
            [globalVars.appBar.overflow]: overflow,
            [globalVars.appBar.backgroundColor]:
              backgroundColor || globalVars.backgroundColor,
            [appScreenCss.vars.appBar.center.mainWidth]: `${maxWidth}px`,
          }),
        )}
      >
        <div className={css.safeArea} />
        <div className={css.container}>
          <div className={css.left}>
            {closeButtonLocation === "left" && renderCloseButton()}
            {renderBackButton()}
            {appendLeft?.()}
          </div>
          <div ref={centerRef} className={css.center}>
            <div
              className={css.centerMain({
                hasLeft,
              })}
            >
              {typeof title === "string" ? (
                <div className={css.centerText}>{title}</div>
              ) : (
                title
              )}
              <button
                className={css.centerMainEdge}
                type="button"
                aria-hidden="true"
                onClick={onTopClick}
              />
            </div>
          </div>
          <div className={css.right}>
            {appendRight?.()}
            {closeButtonLocation === "right" && renderCloseButton()}
          </div>
        </div>
      </div>
    );
  },
);

AppBar.displayName = "AppBar";

export default AppBar;

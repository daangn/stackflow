import { useActions, useActivity } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import React, { useRef } from "react";

import { IconBack, IconClose } from "../assets";
import { useGlobalOptions } from "../basicUIPlugin";
import { useMaxWidth } from "../hooks";
import type { GlobalVars } from "../theme.css";
import { globalVars } from "../theme.css";
import { compactMap, noop } from "../utils";
import * as css from "./AppBar.css";
import * as appScreenCss from "./AppScreen.css";

type AppBarProps = Partial<
  Pick<
    GlobalVars["appBar"],
    | "borderColor"
    | "borderSize"
    | "height"
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
        onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
      }
    | {
        render?: () => React.ReactNode;
      };
  closeButton?:
    | {
        renderIcon?: () => React.ReactNode;
        onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
      }
    | {
        render?: () => React.ReactNode;
      };
  closeButtonLocation?: "left" | "right";
  border?: boolean;
};
const AppBar = React.forwardRef<HTMLDivElement, AppBarProps>(
  (
    {
      title,
      appendLeft,
      appendRight,
      backButton,
      closeButton,
      closeButtonLocation = "left",
      border = true,
      iconColor,
      textColor,
      borderColor,
      borderSize,
      height,
      backgroundColor,
    },
    ref,
  ) => {
    const actions = useActions();
    const activity = useActivity();

    const globalOptions = useGlobalOptions();
    const globalCloseButton = globalOptions.appBar?.closeButton;

    const centerRef = useRef<any>(null);

    const { maxWidth } = useMaxWidth({
      outerRef: ref,
      innerRef: centerRef,
      enable: globalOptions.theme === "cupertino",
    });

    const onBackClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (backButton && "onClick" in backButton && backButton.onClick) {
        backButton.onClick(e);
      }

      if (!e.defaultPrevented) {
        actions.pop();
      }
    };

    const isRoot =
      activity.zIndex === 0 ||
      (activity.zIndex === 1 &&
        activity.transitionState === "enter-active" &&
        activity.pushedBy.name === "Replaced");

    const renderBackButton = () => {
      if (isRoot) {
        return null;
      }

      if (!backButton) {
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

      if ("render" in backButton && backButton.render) {
        return backButton.render?.();
      }

      return (
        <button type="button" className={css.backButton} onClick={onBackClick}>
          {"renderIcon" in backButton && backButton.renderIcon ? (
            backButton.renderIcon()
          ) : (
            <IconBack />
          )}
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
      if ((!closeButton && !globalOptions.appBar?.closeButton) || !isRoot) {
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
        })}
        style={assignInlineVars(
          compactMap({
            [globalVars.appBar.iconColor]: iconColor,
            [globalVars.appBar.textColor]: textColor,
            [globalVars.appBar.borderColor]: borderColor,
            [globalVars.appBar.borderSize]: borderSize,
            [globalVars.appBar.height]: height,
            [globalVars.appBar.backgroundColor]:
              backgroundColor || globalVars.backgroundColor,
            [appScreenCss.vars.appBar.center.mainWidth]: `${maxWidth}px`,
          }),
        )}
      >
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
          </div>
        </div>
        <div className={css.right}>
          {appendRight?.()}
          {closeButtonLocation === "right" && renderCloseButton()}
        </div>
      </div>
    );
  },
);

export default AppBar;

import { useActions } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import { forwardRef, useRef } from "react";

import {
  useAppBarTitleMaxWidth,
  useNullableActivity,
} from "@stackflow/react-ui-core";
import { IconBack, IconClose } from "../../common/assets";
import type { GlobalVars } from "../../common/basicUIPlugin.css";
import { globalVars } from "../../common/basicUIPlugin.css";
import * as css from "../../common/components/AppBar.css";
import * as appScreenCss from "../../common/components/AppScreen.css";
import { compactMap } from "../../common/utils";
import { useGlobalOptions } from "../basicUIPlugin";

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
  title?: React.ReactNode;
  renderLeft?: () => React.ReactNode;
  renderRight?: () => React.ReactNode;
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
  activityEnterStyle?: "slideInLeft";
  onTopClick?: (e: React.MouseEvent) => void;
};
const AppBar = forwardRef<HTMLDivElement, AppBarProps>(
  (
    {
      title,
      renderLeft,
      renderRight,
      backButton,
      closeButton,
      closeButtonLocation = "left",
      border = true,
      modalPresentationStyle,
      activityEnterStyle,
      iconColor,
      iconColorTransitionDuration,
      textColor,
      textColorTransitionDuration,
      borderColor,
      borderColorTransitionDuration,
      borderSize,
      height,
      heightTransitionDuration,
      overflow,
      backgroundColor,
      backgroundColorTransitionDuration,
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

    const { maxWidth } = useAppBarTitleMaxWidth({
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
            aria-label="Go Back"
            className={css.backButton}
            onClick={onBackClick}
            dangerouslySetInnerHTML={{ __html: IconBack() }}
          />
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

            if (modalPresentationStyle === "fullScreen") {
              return <div dangerouslySetInnerHTML={{ __html: IconClose() }} />;
            }

            return <div dangerouslySetInnerHTML={{ __html: IconBack() }} />;
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

            return <div dangerouslySetInnerHTML={{ __html: IconClose() }} />;
          })()}
        </button>
      );
    };

    const hasLeft = !!(
      (closeButtonLocation === "left" && closeButton) ||
      backButton ||
      renderLeft
    );

    return (
      <div
        ref={ref}
        className={css.appBar({
          border,
          modalPresentationStyle,
          activityEnterStyle,
        })}
        style={assignInlineVars(
          compactMap({
            [globalVars.appBar.iconColor]: iconColor,
            [globalVars.appBar.iconColorTransitionDuration]:
              iconColorTransitionDuration,
            [globalVars.appBar.textColor]: textColor,
            [globalVars.appBar.textColorTransitionDuration]:
              textColorTransitionDuration,
            [globalVars.appBar.borderColor]: borderColor,
            [globalVars.appBar.borderColorTransitionDuration]:
              borderColorTransitionDuration,
            [globalVars.appBar.borderSize]: borderSize,
            [globalVars.appBar.height]: height,
            [globalVars.appBar.heightTransitionDuration]:
              heightTransitionDuration,
            [globalVars.appBar.overflow]: overflow,
            [globalVars.appBar.backgroundColor]:
              backgroundColor || globalVars.backgroundColor,
            [globalVars.appBar.backgroundColorTransitionDuration]:
              backgroundColorTransitionDuration,
            [appScreenCss.vars.appBar.center.mainWidth]: `${maxWidth}px`,
          }),
        )}
      >
        <div className={css.safeArea} />
        <div className={css.container}>
          <div className={css.left}>
            {closeButtonLocation === "left" && renderCloseButton()}
            {renderBackButton()}
            {renderLeft?.()}
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
                onClick={onTopClick}
              />
            </div>
          </div>
          <div className={css.right}>
            {renderRight?.()}
            {closeButtonLocation === "right" && renderCloseButton()}
          </div>
        </div>
      </div>
    );
  },
);

AppBar.displayName = "AppBar";

export default AppBar;

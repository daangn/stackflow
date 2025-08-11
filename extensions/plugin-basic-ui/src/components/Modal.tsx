import { useActions } from "@stackflow/react";
import {
  useLazy,
  useNullableActivity,
  usePreventTouchDuringTransition,
  useStyleEffect,
  useZIndexBase,
} from "@stackflow/react-ui-core";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import clsx from "clsx";
import { useRef } from "react";
import type { GlobalVars } from "../basicUIPlugin.css";
import { globalVars } from "../basicUIPlugin.css";
import { compactMap } from "../utils";
import * as css from "./Modal.css";

export type ModalProps = Partial<
  Pick<GlobalVars, "backgroundColor" | "backgroundImage" | "dimBackgroundColor">
> &
  Partial<GlobalVars["modal"]> & {
    onOutsideClick?: React.MouseEventHandler;
    children: React.ReactNode;
    className?: string;
  };
const Modal: React.FC<ModalProps> = ({
  backgroundColor,
  backgroundImage,
  dimBackgroundColor,
  borderRadius = "1rem",
  maxWidth,
  onOutsideClick,
  children,
  className,
}) => {
  const activity = useNullableActivity();
  const { pop } = useActions();

  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  useStyleEffect({
    styleName: "hide",
    refs: [containerRef],
  });
  useStyleEffect({
    styleName: "offset",
    refs: [paperRef],
  });
  useStyleEffect({
    styleName: "swipe-back",
    refs: [paperRef],
  });

  const popLock = useRef(false);

  const onDimClick: React.MouseEventHandler = (e) => {
    onOutsideClick?.(e);

    if (e.defaultPrevented) {
      return;
    }

    if (popLock.current) {
      return;
    }
    popLock.current = true;

    pop();
  };
  const onPaperClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();
  };

  const zIndexBase = useZIndexBase() + 3;
  const zIndexPaper = useZIndexBase() + 4;
  const transitionState = activity?.transitionState ?? "enter-done";

  usePreventTouchDuringTransition({
    ref: containerRef,
  });

  return (
    <div
      className={clsx(
        css.container({
          transitionState: useLazy(transitionState),
        }),
        className,
      )}
      ref={containerRef}
      style={assignInlineVars(
        compactMap({
          [globalVars.backgroundColor]: backgroundColor,
          [globalVars.backgroundImage]: backgroundImage,
          [globalVars.dimBackgroundColor]: dimBackgroundColor,
          [globalVars.modal.borderRadius]: borderRadius,
          [globalVars.modal.maxWidth]: maxWidth,
          [css.vars.zIndexes.dim]: `${zIndexBase}`,
          [css.vars.zIndexes.paper]: `${zIndexPaper}`,
          [css.vars.transitionDuration]:
            transitionState === "enter-active" ||
            transitionState === "exit-active"
              ? globalVars.computedTransitionDuration
              : "0ms",
        }),
      )}
      data-stackflow-component-name="Modal"
      data-stackflow-activity-id={activity?.id}
      data-stackflow-activity-is-active={activity?.isActive}
    >
      <div className={css.dim} ref={paperRef} onClick={onDimClick}>
        <div className={css.paper} onClick={onPaperClick}>
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.displayName = "Modal";

export default Modal;

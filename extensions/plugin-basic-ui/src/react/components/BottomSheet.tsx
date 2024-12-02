import { useActions } from "@stackflow/react";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import { useRef } from "react";

import {
  useLazy,
  useNullableActivity,
  useStyleEffect,
  useZIndexBase,
} from "@stackflow/react-ui-core";
import type { GlobalVars } from "../../common/basicUIPlugin.css";
import { globalVars } from "../../common/basicUIPlugin.css";
import * as css from "../../common/components/BottomSheet.css";
import { compactMap } from "../../common/utils";

export type BottomSheetProps = Partial<
  Pick<GlobalVars, "backgroundColor" | "dimBackgroundColor">
> &
  Partial<GlobalVars["bottomSheet"]> & {
    paperRef?: React.Ref<HTMLDivElement>;
    onOutsideClick?: React.MouseEventHandler;
    children: React.ReactNode;
  };
const BottomSheet: React.FC<BottomSheetProps> = ({
  borderRadius = "1rem",
  backgroundColor,
  dimBackgroundColor,
  paperRef,
  onOutsideClick,
  children,
}) => {
  const activity = useNullableActivity();
  const { pop } = useActions();

  const containerRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);

  useStyleEffect({
    styleName: "hide",
    refs: [containerRef],
  });
  useStyleEffect({
    styleName: "offset",
    refs: [dimRef],
  });
  useStyleEffect({
    styleName: "swipe-back",
    refs: [dimRef],
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

  return (
    <div
      className={css.container({
        transitionState: useLazy(transitionState),
      })}
      ref={containerRef}
      style={assignInlineVars(
        compactMap({
          [globalVars.bottomSheet.borderRadius]: borderRadius,
          [globalVars.backgroundColor]: backgroundColor,
          [globalVars.dimBackgroundColor]: dimBackgroundColor,
          [css.vars.zIndexes.dim]: `${zIndexBase}`,
          [css.vars.zIndexes.paper]: `${zIndexPaper}`,
          [css.vars.transitionDuration]:
            transitionState === "enter-active" ||
            transitionState === "exit-active"
              ? globalVars.computedTransitionDuration
              : "0ms",
        }),
      )}
      data-stackflow-component-name="BottomSheet"
      data-stackflow-activity-id={activity?.id}
      data-stackflow-activity-is-active={activity?.isActive}
    >
      <div className={css.dim} ref={dimRef} onClick={onDimClick}>
        <div className={css.paper} ref={paperRef} onClick={onPaperClick}>
          {children}
        </div>
      </div>
    </div>
  );
};

BottomSheet.displayName = "BottomSheet";

export default BottomSheet;

/* @jsxImportSource solid-js */

import { useActions, useActivity } from "@stackflow/solid";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import type { Accessor, Component, JSXElement } from "solid-js";
import { createMemo } from "solid-js";

import {
  createLazy,
  createStyleEffect,
  createZIndexBase,
} from "@stackflow/solid-ui-core";
import type { GlobalVars } from "../../common/basicUIPlugin.css";
import { globalVars } from "../../common/basicUIPlugin.css";
import * as css from "../../common/components/BottomSheet.css";
import { compactMap } from "../../common/utils";

export type BottomSheetProps = Partial<
  Pick<GlobalVars, "backgroundColor" | "dimBackgroundColor">
> &
  Partial<GlobalVars["bottomSheet"]> & {
    paperRef?: Accessor<HTMLDivElement | undefined>;
    onOutsideClick?: (e: MouseEvent) => void;
    children: JSXElement;
  };
const BottomSheet: Component<BottomSheetProps> = (props) => {
  const activity = useActivity();
  const { pop } = useActions();

  let containerRef: HTMLDivElement | undefined;
  let dimRef: HTMLDivElement | undefined;

  createStyleEffect({
    styleName: "hide",
    refs: [() => containerRef],
  });
  createStyleEffect({
    styleName: "offset",
    refs: [() => dimRef],
  });
  createStyleEffect({
    styleName: "swipe-back",
    refs: [() => dimRef],
  });

  let popLock = false;

  const onDimClick = (e: MouseEvent) => {
    props.onOutsideClick?.(e);

    if (e.defaultPrevented) {
      return;
    }

    if (popLock) {
      return;
    }
    popLock = true;

    pop();
  };
  const onPaperClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const zIndexBase = createZIndexBase();
  const zIndexDim = createMemo(() => zIndexBase() + 3);
  const zIndexPaper = createMemo(() => zIndexBase() + 4);
  const transitionState = createMemo(
    () => activity()?.transitionState ?? "enter-done",
  );
  const lazyTransitionState = createLazy(transitionState);

  return (
    <div
      class={css.container({
        transitionState: lazyTransitionState(),
      })}
      ref={containerRef}
      style={assignInlineVars(
        compactMap({
          [globalVars.bottomSheet.borderRadius]: props.borderRadius,
          [globalVars.backgroundColor]: props.backgroundColor,
          [globalVars.dimBackgroundColor]: props.dimBackgroundColor,
          [css.vars.zIndexes.dim]: `${zIndexDim()}`,
          [css.vars.zIndexes.paper]: `${zIndexPaper()}`,
          [css.vars.transitionDuration]:
            transitionState() === "enter-active" ||
            transitionState() === "exit-active"
              ? globalVars.computedTransitionDuration
              : "0ms",
        }),
      )}
      data-stackflow-component-name="BottomSheet"
      data-stackflow-activity-id={activity()?.id}
      data-stackflow-activity-is-active={activity()?.isActive}
    >
      <div class={css.dim} ref={dimRef} onClick={onDimClick}>
        <div class={css.paper} ref={props.paperRef} onClick={onPaperClick}>
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;

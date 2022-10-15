/* eslint-disable no-param-reassign */

import { useActivity } from "@stackflow/react";
import type React from "react";
import { useEffect } from "react";

const OFFSET_TRANSFORM_ANDROID = "translateY(-2rem)";
const OFFSET_TRANSFORM_CUPERTINO = "translateX(-5rem)";

const reg: Map<
  number,
  {
    targetRefs: Array<React.RefObject<any>>;
    isActivityCover: boolean;
  }
> = new Map();

function listenOnce<T extends HTMLElement>(
  el: T,
  type: keyof HTMLElementEventMap,
  cb: () => void,
) {
  const listener = () => {
    el.removeEventListener(type, listener);
    cb();
  };

  el.addEventListener(type, listener);
}

export function useOffset({
  targetRefs,
  isActivityCover = false,
  theme,
}: {
  targetRefs: Array<React.RefObject<any>>;
  isActivityCover?: boolean;
  theme: "android" | "cupertino";
}) {
  const activity = useActivity();

  useEffect(() => {
    reg.set(activity.zIndex, {
      targetRefs,
      isActivityCover,
    });

    return () => {
      reg.delete(activity.zIndex);
    };
  }, [activity.id, targetRefs, isActivityCover]);

  useEffect(() => {
    if (!isActivityCover) {
      return;
    }

    const transform =
      theme === "cupertino"
        ? OFFSET_TRANSFORM_CUPERTINO
        : OFFSET_TRANSFORM_ANDROID;

    const targetRefs = (() => {
      let refs: Array<React.RefObject<any>> = [];

      for (let i = 1; i <= activity.zIndex; i += 1) {
        const item = reg.get(activity.zIndex - i);

        if (item?.targetRefs) {
          refs = [...refs, ...item.targetRefs];
        }
        if (item?.isActivityCover) {
          break;
        }
      }

      return refs;
    })();

    switch (activity.transitionState) {
      case "enter-active":
      case "enter-done": {
        targetRefs.forEach((ref) => {
          ref.current.style.transform = transform;
          ref.current.style.transition = `transform var(--stackflow-transition-duration)`;
        });
        break;
      }
      case "exit-active":
      case "exit-done": {
        targetRefs.forEach((ref) => {
          ref.current.style.transform = "";

          listenOnce(ref.current, "transitionend", () => {
            ref.current.style.transition = "";
          });
        });
        break;
      }
      default: {
        break;
      }
    }
  }, [activity.transitionState, theme]);
}

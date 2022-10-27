import type { ActivityTransitionState } from "@stackflow/core";
import { useActivity } from "@stackflow/react";
import type React from "react";
import { useEffect } from "react";

const connections: {
  [styleName: string]: Map<
    number,
    {
      refs: Array<React.RefObject<any>>;
      hasEffect: boolean;
    }
  >;
} = {};

export function useStyleEffect({
  styleName,
  refs,
  effect,
}: {
  styleName: string;
  refs: Array<React.RefObject<any>>;
  effect?: (params: {
    activityTransitionState: ActivityTransitionState;
    refs: Array<React.RefObject<HTMLElement>>;
  }) => (() => void) | void;
}) {
  const activity = useActivity();

  useEffect(() => {
    if (!connections[styleName]) {
      connections[styleName] = new Map();
    }

    connections[styleName].set(activity.zIndex, {
      refs,
      hasEffect: !!effect,
    });

    return () => {
      connections[styleName].delete(activity.zIndex);
    };
  }, [activity.id, refs, effect]);

  useEffect(() => {
    if (!effect) {
      return () => {};
    }

    const refs = (() => {
      let arr: Array<React.RefObject<any>> = [];

      for (let i = 1; i <= activity.zIndex; i += 1) {
        const connection = connections[styleName].get(activity.zIndex - i);

        if (connection?.refs) {
          arr = [...arr, ...connection.refs];
        }
        if (connection?.hasEffect) {
          break;
        }
      }

      return arr;
    })();

    const cleanup = effect({
      activityTransitionState: activity.transitionState,
      refs,
    });

    return () => {
      cleanup?.();
    };
  }, [activity.transitionState]);
}

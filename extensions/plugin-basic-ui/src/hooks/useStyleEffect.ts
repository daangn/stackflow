import type { ActivityTransitionState } from "@stackflow/core";
import { useEffect } from "react";

import { noop } from "../utils";
import { useNullableActivity } from "./useNullableActivity";

const connections: {
  [styleName: string]: Map<
    number,
    {
      refs: Array<React.RefObject<any>>;
      hasEffect: boolean;
    }
  >;
} = {};

export function useStyleEffect<T extends HTMLElement>({
  styleName,
  refs,
  effect,
  effectDeps,
}: {
  styleName: string;
  refs: Array<React.RefObject<T>>;
  effect?: (params: {
    activityTransitionState: ActivityTransitionState;
    refs: Array<React.RefObject<T>>;
  }) => (() => void) | void;
  effectDeps?: any[];
}) {
  const activity = useNullableActivity();

  useEffect(() => {
    if (!activity) {
      return noop;
    }
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
  }, [activity?.id, refs, effect]);

  useEffect(() => {
    if (!activity) {
      return noop;
    }
    if (!effect) {
      return noop;
    }

    const refs = (() => {
      let arr: Array<React.RefObject<T>> = [];

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
  }, [activity?.transitionState, ...(effectDeps ?? [])]);
}

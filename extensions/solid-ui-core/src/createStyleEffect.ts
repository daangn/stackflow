import type { ActivityTransitionState } from "@stackflow/core";
import { useActivity } from "@stackflow/solid";
import type { Accessor } from "solid-js";
import { createEffect, onCleanup, untrack } from "solid-js";

const connections: {
  [styleName: string]: Map<
    number,
    {
      refs: Array<Accessor<any>>;
      hasEffect: boolean;
    }
  >;
} = {};

export function createStyleEffect<T extends HTMLElement, U>({
  styleName,
  refs,
  effect,
  effectDeps,
}: {
  styleName: string;
  refs: Array<Accessor<T | undefined>>;
  effect?: (params: {
    activityTransitionState: ActivityTransitionState;
    refs: Array<Accessor<T | undefined>>;
    deps?: U;
  }) => void;
  effectDeps?: () => U;
}) {
  const getActivity = useActivity();

  createEffect(() => {
    const activity = getActivity();
    if (!activity?.id) {
      return;
    }
    if (!connections[styleName]) {
      connections[styleName] = new Map();
    }

    connections[styleName].set(activity.zIndex, {
      refs,
      hasEffect: !!effect,
    });

    onCleanup(() => {
      connections[styleName].delete(activity.zIndex);
    });
  });

  createEffect(() => {
    const activity = getActivity();
    if (!activity) {
      return;
    }
    if (!effect) {
      return;
    }

    const refs = (() => {
      let arr: Array<Accessor<T>> = [];
      const zIndex = untrack(() => activity.zIndex);

      for (let i = 1; i <= zIndex; i += 1) {
        const connection = connections[styleName].get(zIndex - i);

        if (connection?.refs) {
          arr = [...arr, ...connection.refs];
        }
        if (connection?.hasEffect) {
          break;
        }
      }

      return arr;
    })();

    effect({
      activityTransitionState: activity.transitionState,
      refs,
      deps: effectDeps?.(),
    });
  });
}

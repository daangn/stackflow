import {
  produceEffects,
  StackflowPluginHook,
  StackflowPluginPostEffectHook,
} from "@stackflow/core";
import React, { useCallback, useEffect, useRef } from "react";

import { usePlugins } from "./plugins";
import { useStack, useStackActions } from "./stack";
import { useStackContext } from "./stack-context";

const EffectManager: React.FC = () => {
  const stack = useStack();
  const stackActions = useStackActions();
  const plugins = usePlugins();
  const stackContext = useStackContext();

  const onInit = useCallback<StackflowPluginHook>((actions) => {
    plugins.forEach((plugin) => {
      plugin.onInit?.(actions);
    });
  }, []);

  const triggerEffect = useCallback<StackflowPluginPostEffectHook<any>>(
    ({ actions, effect }) => {
      switch (effect._TAG) {
        case "PUSHED": {
          plugins.forEach((plugin) =>
            plugin.onPushed?.({ actions, effect, stackContext }),
          );
          break;
        }
        case "POPPED": {
          plugins.forEach((plugin) =>
            plugin.onPopped?.({ actions, effect, stackContext }),
          );
          break;
        }
        case "REPLACED": {
          plugins.forEach((plugin) =>
            plugin.onReplaced?.({ actions, effect, stackContext }),
          );
          break;
        }
        case "%SOMETHING_CHANGED%": {
          plugins.forEach((plugin) =>
            plugin.onChanged?.({ actions, effect, stackContext }),
          );
          break;
        }
        default: {
          break;
        }
      }
    },
    [],
  );

  useEffect(() => {
    onInit?.({
      actions: {
        dispatchEvent: stackActions.dispatchEvent,
        getState: stackActions.getState,
      },
      stackContext,
    });
  }, []);

  const prevStateRef = useRef(stack);

  useEffect(() => {
    const prevState = prevStateRef.current;
    const effects = prevState ? produceEffects(prevState, stack) : [];

    effects.forEach((effect) => {
      triggerEffect({
        actions: {
          dispatchEvent: stackActions.dispatchEvent,
          getState: stackActions.getState,
        },
        effect,
        stackContext,
      });
    });

    prevStateRef.current = { ...stack };
  }, [stack, stackActions]);

  return null;
};

export default EffectManager;

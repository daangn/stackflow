import type {
  StackflowPluginHook,
  StackflowPluginPostEffectHook,
} from "@stackflow/core";
import { produceEffects } from "@stackflow/core";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";

import { useCoreActions, useCoreState } from "./core";
import { usePlugins } from "./plugins";

const EffectManager: React.FC = () => {
  const plugins = usePlugins();

  const coreState = useCoreState();
  const coreActions = useCoreActions();

  const onInit = useCallback<StackflowPluginHook>((actions) => {
    plugins.forEach((plugin) => {
      plugin.onInit?.(actions);
    });
  }, []);

  const triggerEffect = useCallback<StackflowPluginPostEffectHook<any>>(
    ({ actions, effect }) => {
      switch (effect._TAG) {
        case "PUSHED": {
          plugins.forEach((plugin) => plugin.onPushed?.({ actions, effect }));
          break;
        }
        case "POPPED": {
          plugins.forEach((plugin) => plugin.onPopped?.({ actions, effect }));
          break;
        }
        case "REPLACED": {
          plugins.forEach((plugin) => plugin.onReplaced?.({ actions, effect }));
          break;
        }
        case "%SOMETHING_CHANGED%": {
          plugins.forEach((plugin) => plugin.onChanged?.({ actions, effect }));
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
      actions: coreActions,
    });
  }, []);

  const prevStateRef = useRef(coreState);

  useEffect(() => {
    const prevState = prevStateRef.current;
    const effects = prevState ? produceEffects(prevState, coreState) : [];

    effects.forEach((effect) => {
      triggerEffect({
        actions: coreActions,
        effect,
      });
    });

    prevStateRef.current = { ...coreState };
  }, [coreState]);

  return null;
};

export default EffectManager;

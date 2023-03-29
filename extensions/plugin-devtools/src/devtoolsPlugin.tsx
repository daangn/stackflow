import type {
  DomainEvent,
  Effect,
  Stack,
  StackflowActions,
  StackflowPlugin,
} from "@stackflow/core";

export type EffectLog = {
  effect: Effect;
  timestamp: number;
};

export type StackflowData = {
  stack: Stack;
  eventLogs: DomainEvent[];
  effectLogs: EffectLog[];
};

export type StackflowDataKey = keyof StackflowData;

export type DataChangedMessage = {
  type: "DATA_CHANGED";
  payload: StackflowDataKey;
};

export type StackflowMessage = DataChangedMessage;

export type StackflowHook = {
  data: StackflowData;
  actions: StackflowActions;
};

type Tag = Effect["_TAG"];
type EffectType<T extends Tag> = Extract<Effect, { _TAG: T }>;

declare global {
  interface Window {
    __STACKFLOW_DEVTOOLS__: StackflowHook;
  }
}

function sendMessage(msg: StackflowMessage) {
  window.postMessage(msg, "*");
}

function changeData<K extends StackflowDataKey>(
  key: K,
  reducer: (data: StackflowData[K]) => StackflowData[K],
) {
  window.__STACKFLOW_DEVTOOLS__.data[key] = reducer(
    window.__STACKFLOW_DEVTOOLS__.data[key],
  );
  sendMessage({
    type: "DATA_CHANGED",
    payload: key,
  });
}

function logEffect<T extends Tag>(effect: EffectType<T>) {
  const effectLog = {
    effect,
    timestamp: Date.now(),
  };
  changeData("effectLogs", (logs) => [...logs, effectLog]);
}

function logEvent<T extends DomainEvent>(
  event: Omit<T, "id" | "name" | "eventDate">,
) {
  const eventLog = event as T;
  changeData("eventLogs", (logs) => [...logs, eventLog]);
}

export function devtoolsPlugin(): StackflowPlugin {
  return () => ({
    key: "plugin-devtools",
    onInit({ actions }) {
      window.__STACKFLOW_DEVTOOLS__ = {
        data: {
          stack: actions.getStack(),
          eventLogs: [],
          effectLogs: [],
        },
        actions,
      };
    },
    onBeforePush({ actionParams: event }) {
      logEvent(event);
    },
    onBeforePop({ actionParams: event }) {
      logEvent(event);
    },
    onBeforeReplace({ actionParams: event }) {
      logEvent(event);
    },
    onBeforeStepPush({ actionParams: event }) {
      logEvent(event);
    },
    onBeforeStepPop({ actionParams: event }) {
      logEvent(event);
    },
    onBeforeStepReplace({ actionParams: event }) {
      logEvent(event);
    },
    onPushed({ effect }) {
      logEffect(effect);
    },
    onPopped({ effect }) {
      logEffect(effect);
    },
    onReplaced({ effect }) {
      logEffect(effect);
    },
    onStepPushed({ effect }) {
      logEffect(effect);
    },
    onStepPopped({ effect }) {
      logEffect(effect);
    },
    onStepReplaced({ effect }) {
      logEffect(effect);
    },
    onChanged({ actions }) {
      window.__STACKFLOW_DEVTOOLS__.actions = actions;
      changeData("stack", () => actions.getStack());
    },
  });
}

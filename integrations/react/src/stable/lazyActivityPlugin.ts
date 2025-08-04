import type { ActivityComponentType } from "../__internal__/ActivityComponentType";
import type { StackflowReactPlugin } from "../__internal__/StackflowReactPlugin";


// https://github.com/facebook/react/blob/v19.1.1/packages/shared/ReactSymbols.js#L32
const REACT_LAZY_TYPE: symbol = Symbol.for("react.lazy");
const REACT_MEMO_TYPE: symbol = Symbol.for('react.memo');

// https://github.com/facebook/react/blob/v19.1.1/packages/react/src/ReactLazy.js
interface Wakeable {
  then(onFulfill: () => unknown, onReject: () => unknown): undefined | Wakeable;
}

interface ThenableImpl<T> {
  then(
    onFulfill: (value: T) => unknown,
    onReject: (error: unknown) => unknown,
  ): undefined | Wakeable;
}
interface UntrackedThenable<T> extends ThenableImpl<T> {
  status?: undefined;
}

interface PendingThenable<T> extends ThenableImpl<T> {
  status: "pending";
}

interface FulfilledThenable<T> extends ThenableImpl<T> {
  status: "fulfilled";
  value: T;
}

interface RejectedThenable<T> extends ThenableImpl<T> {
  status: "rejected";
  reason: unknown;
}

type Thenable<T> =
  | UntrackedThenable<T>
  | PendingThenable<T>
  | FulfilledThenable<T>
  | RejectedThenable<T>;

const Uninitialized = -1;
const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type UninitializedPayload<T> = {
  _status: -1;
  _result: () => Thenable<{ default: T }>;
};

type PendingPayload = {
  _status: 0;
  _result: Wakeable;
};

type ResolvedPayload<T> = {
  _status: 1;
  _result: { default: T };
};

type RejectedPayload = {
  _status: 2;
  _result: unknown;
};

type Payload<T> =
  | UninitializedPayload<T>
  | PendingPayload
  | ResolvedPayload<T>
  | RejectedPayload;

type LazyComponent = {
  $$typeof: symbol | number;
  _payload: Payload<unknown>;
};

type MemoComponent = {
  $$typeof: symbol | number;
  type: React.ElementType;
};

function isLazyComponent(component: unknown): component is LazyComponent {
  const isLazy = (
    typeof component === "object" &&
    component !== null &&
    "$$typeof" in component &&
      component.$$typeof === REACT_LAZY_TYPE &&
      "_payload" in component
    );
  return isLazy;
}

function isMemoComponent(component: unknown): component is MemoComponent {
  const isMemo = (
    typeof component === "object" &&
    component !== null &&
    "$$typeof" in component &&
    component.$$typeof === REACT_MEMO_TYPE
  );
  return isMemo;
}

export function lazyActivityPlugin(activityComponentMap: {
  [key: string]: ActivityComponentType;
}): StackflowReactPlugin {
  function handleLazyActivity({ actions, actionParams }: {
    actions: { pause: () => void; resume: () => void };
    actionParams: { activityName: string };
  }) {
    let Activity = activityComponentMap[actionParams.activityName];

    if (isMemoComponent(Activity)) {
      Activity = Activity.type as ActivityComponentType;
    }

    if (
      isLazyComponent(Activity) &&
      Activity._payload._status === Uninitialized
    ) {
      actions.pause();

      Activity._payload._result().then(
        () => {
          actions.resume();
        },
        () => {
          actions.resume();
        },
      );
    }
  }

  return () => ({
    key: "plugin-lazy-activity",
    onBeforePush({ actions, actionParams }) {
      handleLazyActivity({ actions, actionParams });
    },
    onBeforeReplace({ actions, actionParams }) {
      handleLazyActivity({ actions, actionParams });
    },
  });
}

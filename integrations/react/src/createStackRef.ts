import type { BaseActivities } from "./BaseActivities";
import type { CoreActionsContextValue } from "./core/CoreActionsContext";
import type { UseActionsOutputType } from "./useActions";

export type StackRefCurrentType<T extends BaseActivities> = {
  actions: UseActionsOutputType<T> & CoreActionsContextValue;
};

export type StackRefType<T extends BaseActivities> = React.MutableRefObject<
  StackRefCurrentType<T>
> & {
  isReady: () => boolean;
};

export function createStackRef() {
  let current: StackRefCurrentType<BaseActivities>;
  const ref: StackRefType<BaseActivities> = {
    get current() {
      return current;
    },
    set current(value: StackRefCurrentType<BaseActivities>) {
      current = value;
    },
    isReady: () => {
      if (!current) {
        return false;
      }
      return true;
    },
  };
  return ref;
}

import type { BaseActivities } from "./BaseActivities";
import type { CoreActionsContextValue } from "./core/CoreActionsContext";
import type { UseActionsOutputType } from "./useActions";

export type StackRefCurrentType<T extends BaseActivities> = {
  actions: Omit<UseActionsOutputType<T>, "pending"> & CoreActionsContextValue;
};

export type StackRefType<T extends BaseActivities> = React.MutableRefObject<
  StackRefCurrentType<T>
> & {
  isReady: () => boolean;
};

export function createStackRef<T extends BaseActivities>(): StackRefType<T> {
  let current: StackRefCurrentType<T>;

  const ref: StackRefType<T> = {
    isReady: () => {
      if (!current) {
        return false;
      }
      return true;
    },
    get current() {
      return current;
    },
    set current(value: StackRefCurrentType<T>) {
      current = value;
    },
  };
  return ref;
}

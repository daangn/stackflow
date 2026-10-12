import * as StackflowReact from "@stackflow/react";

type NavigationHook = () => {
  pop(): void;
};

const navigationHooks = StackflowReact as unknown as {
  useFlow?: NavigationHook;
  useActions: NavigationHook;
};

// Stackflow React 1.x exposes the global navigation hook as useActions.
export function usePop() {
  const useNavigation = navigationHooks.useFlow ?? navigationHooks.useActions;
  return useNavigation().pop;
}

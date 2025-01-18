import { useMounted } from "./useMounted";
import { useNullableActivity } from "./useNullableActivity";

export function useActivityDataAttributes() {
  const activity = useNullableActivity();
  const mounted = useMounted();

  return {
    /**
     * should be rendered in client-side only to avoid hydration mismatch warning
     */
    ...(mounted
      ? {
          "data-stackflow-activity-id": activity?.id,
          "data-stackflow-activity-is-active": activity?.isActive,
          "data-stackflow-activity-transition-state": activity?.transitionState,
        }
      : null),
  };
}

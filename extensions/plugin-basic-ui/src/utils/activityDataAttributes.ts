import type { Activity } from "@stackflow/core";

export function activityDataAttributes({
  activity,
  mounted,
}: { activity?: Activity | null; mounted?: boolean }) {
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

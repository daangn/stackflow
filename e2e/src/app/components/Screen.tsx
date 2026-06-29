/**
 * One screen. Exposes the DOM observation markers and, for the active activity,
 * the navigation controls. Blocker arming is rendered whenever the activity is
 * mounted (plugin-blocker scopes it to the active activity), while controls are
 * rendered only for the active activity so each control test id is unique.
 */

import { useActivity } from "@stackflow/react";
import { type ActivityName, testid } from "../../shared/contract";
import { useHarnessConfig } from "../HarnessConfigContext";
import { BlockerMounts } from "./Blockers";
import { Controls } from "./Controls";

export function Screen({ activityName }: { activityName: ActivityName }) {
  const activity = useActivity();
  const config = useHarnessConfig();
  const isActive = activity.isActive;
  const stepIndex = Math.max(0, activity.steps.length - 1);

  return (
    <div
      data-testid={testid.screen(activityName)}
      data-active={isActive ? "true" : "false"}
      data-activity-params={JSON.stringify(activity.params)}
      data-step-index={stepIndex}
      data-transition-state={activity.transitionState}
    >
      <BlockerMounts activityName={activityName} config={config} />
      {isActive ? <Controls activityName={activityName} /> : null}
    </div>
  );
}

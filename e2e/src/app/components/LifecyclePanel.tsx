/**
 * App-root controls that must remain available regardless of which activity is
 * active: per-blocker mount toggles (lifecycle cases) and the blocker dialog
 * host. Rendering them at the root is what lets a captured proceed be invoked
 * after the blocker-owning component has unmounted.
 */

import { testid } from "../../shared/contract";
import { useHarnessConfig } from "../HarnessConfigContext";
import { harnessStore } from "../harnessStore";
import { useHarnessVersion } from "../useHarnessVersion";
import { BlockerDialogHost } from "./Blockers";

export function LifecyclePanel() {
  useHarnessVersion();
  const config = useHarnessConfig();

  // Every blocker id that any armed activity can mount, deduplicated.
  const ids = Array.from(
    { length: config.blockerCount },
    (_, i) => `b${i + 1}`,
  ).filter(() => config.armed.length > 0);

  return (
    <div>
      {ids.map((id) => (
        <span key={id}>
          <button
            type="button"
            data-testid={testid.blockerMountToggle(id)}
            onClick={() => harnessStore.toggleMount(id)}
          >
            mount {id} ({harnessStore.isMounted(id) ? "mounted" : "unmounted"})
          </button>
          <button
            type="button"
            data-testid={testid.blockerArmToggle(id)}
            onClick={() => harnessStore.toggleArm(id)}
          >
            arm {id} ({harnessStore.isArmed(id) ? "armed" : "disarmed"})
          </button>
        </span>
      ))}
      <BlockerDialogHost />
    </div>
  );
}

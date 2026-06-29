/**
 * Blocker arming and the app-level dialog host.
 *
 * `BlockerMounts` registers one `useBlocker` per armed blocker id on the
 * activity that owns it, mirroring plugin-blocker's own usage. Registration is
 * kept faithful to the original: the blocker is registered while the activity
 * is mounted and plugin-blocker scopes it to the active activity — except when
 * a lifecycle case explicitly unmounts a blocker via the store's mount toggle.
 *
 * A blocker's `onBlocked` records the notification and captures `proceed` into
 * the module-level store, so the dialog (rendered at app root) and the captured
 * proceed both outlive the owning component. `block-confirm` invokes proceed;
 * `block-cancel` dismisses the dialog while leaving the navigation blocked.
 */

import { useBlocker } from "@stackflow/plugin-blocker";
import { useFlow } from "@stackflow/react";
import { useRef } from "react";
import {
  type ActivityName,
  type BlockableAction,
  type BlockerId,
  testid,
} from "../../shared/contract";
import { harnessStore } from "../harnessStore";
import type { HarnessConfig } from "../query";
import { armedActionsFor, blockerIdsFor } from "../query";
import { useHarnessVersion } from "../useHarnessVersion";

function ArmedBlocker({
  blockerId,
  actions,
  async,
  onBlockedNav,
}: {
  blockerId: BlockerId;
  actions: Set<BlockableAction>;
  async: boolean;
  onBlockedNav: "replace" | null;
}) {
  // Re-render (and re-register useBlocker with a fresh shouldBlock) when the
  // arm toggle flips, so the last committed render's decision is the one used.
  useHarnessVersion();
  const armed = harnessStore.isArmed(blockerId);
  const { replace } = useFlow();
  const nestedFired = useRef(false);

  useBlocker({
    shouldBlock: (action) => {
      harnessStore.logShouldBlock(blockerId, action.name as BlockableAction);
      return armed && actions.has(action.name as BlockableAction);
    },
    onBlocked: ({ action }, { proceed }) => {
      const name = action.name as BlockableAction;
      harnessStore.logBlocked(blockerId, name);
      harnessStore.addPending({ blockerId, action: name, proceed, async });
      // Reentrancy: start a nested navigation from inside onBlocked.
      if (onBlockedNav === "replace" && !nestedFired.current) {
        nestedFired.current = true;
        replace("Third", { thirdId: "nested" });
      }
    },
  });
  return null;
}

export function BlockerMounts({
  activityName,
  config,
}: {
  activityName: ActivityName;
  config: HarnessConfig;
}) {
  // Subscribe so lifecycle mount toggles re-render this subtree.
  useHarnessVersion();
  const ids = blockerIdsFor(config, activityName);
  const actions = armedActionsFor(config, activityName);

  return (
    <>
      {ids
        .filter((id) => harnessStore.isMounted(id))
        .map((id) => (
          <ArmedBlocker
            key={id}
            blockerId={id}
            actions={actions}
            async={config.blockAsync}
            onBlockedNav={config.onBlockedNav}
          />
        ))}
    </>
  );
}

export function BlockerDialogHost() {
  useHarnessVersion();
  const pending = harnessStore.pending;

  return (
    <div>
      {pending.map((p) => (
        <div key={p.blockerId} data-testid={testid.blockDialog(p.blockerId)}>
          <span data-testid={testid.blocking(p.blockerId)}>blocking</span>
          <button
            type="button"
            data-testid={testid.blockConfirm(p.blockerId)}
            onClick={() => harnessStore.confirm(p.blockerId)}
          >
            proceed
          </button>
          <button
            type="button"
            data-testid={testid.blockCancel(p.blockerId)}
            onClick={() => harnessStore.cancel(p.blockerId)}
          >
            cancel
          </button>
        </div>
      ))}
    </div>
  );
}

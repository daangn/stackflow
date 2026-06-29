/**
 * Module-level observation store for the harness app.
 *
 * It lives outside React on purpose: a blocker's captured `proceed` must remain
 * invokable after the component that owns the blocker has unmounted, and the
 * instrumentation bridge must read a consistent snapshot synchronously. React
 * views subscribe to a monotonically increasing version to re-render.
 */

import type {
  BlockableAction,
  BlockerId,
  BlockerLogEntry,
  ProbeLogEntry,
} from "../shared/contract";

interface PendingBlock {
  blockerId: BlockerId;
  action: BlockableAction;
  proceed: () => void;
  /** When true, confirm() invokes proceed across a real async gap. */
  async: boolean;
}

/** Delay used to model "user confirms later, asynchronously" (blockAsync). */
const ASYNC_CONFIRM_GAP_MS = 20;

class HarnessStore {
  private version = 0;
  private listeners = new Set<() => void>();

  blockerLog: BlockerLogEntry[] = [];
  probeLog: ProbeLogEntry[] = [];
  errors: string[] = [];
  fallbackCount = 0;

  /** One entry per blocker that has vetoed a not-yet-resolved navigation. */
  pending: PendingBlock[] = [];
  /** blockerId → mounted; absence means mounted (default true). */
  private mounted = new Map<BlockerId, boolean>();
  /** Blocker ids whose arming has been toggled off (default armed). */
  private disarmed = new Set<BlockerId>();
  /** hook name → number of times the probe co-plugin has run it. */
  private probeCounts = new Map<string, number>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = (): number => this.version;

  private bump() {
    this.version += 1;
    for (const l of this.listeners) {
      l();
    }
  }

  // --- blocker notifications (public contract of plugin-blocker) ---

  logShouldBlock(blockerId: BlockerId, action: BlockableAction) {
    this.blockerLog.push({ blockerId, action, phase: "shouldBlock" });
    this.bump();
  }

  logBlocked(blockerId: BlockerId, action: BlockableAction, threw?: boolean) {
    this.blockerLog.push({ blockerId, action, phase: "blocked", threw });
    this.bump();
  }

  logProceed(blockerId: BlockerId, action: BlockableAction) {
    this.blockerLog.push({ blockerId, action, phase: "proceed" });
    this.bump();
  }

  logError(error: unknown) {
    this.errors.push(error instanceof Error ? error.message : String(error));
    this.bump();
  }

  // --- initial-routing observation ---

  incFallbackCount() {
    this.fallbackCount += 1;
    this.bump();
  }

  // --- pending blocks / captured proceed ---

  addPending(block: PendingBlock) {
    // A fresh veto by the same blocker supersedes any stale one, keeping at
    // most one dialog per blocker id.
    this.pending = this.pending.filter((p) => p.blockerId !== block.blockerId);
    this.pending.push(block);
    this.bump();
  }

  /** Invoke the captured proceed; the dialog persists so it can be called
   * again (proceed idempotency is the plugin's guarantee). */
  confirm(blockerId: BlockerId) {
    const block = this.pending.find((p) => p.blockerId === blockerId);
    if (!block) {
      return;
    }
    this.logProceed(block.blockerId, block.action);
    if (block.async) {
      setTimeout(() => block.proceed(), ASYNC_CONFIRM_GAP_MS);
    } else {
      block.proceed();
    }
  }

  /** Dismiss the dialog without proceeding; the navigation stays blocked. */
  cancel(blockerId: BlockerId) {
    this.pending = this.pending.filter((p) => p.blockerId !== blockerId);
    this.bump();
  }

  isBlocking(blockerId: BlockerId): boolean {
    return this.pending.some((p) => p.blockerId === blockerId);
  }

  // --- lifecycle mount toggling ---

  isMounted(blockerId: BlockerId): boolean {
    return this.mounted.get(blockerId) ?? true;
  }

  toggleMount(blockerId: BlockerId) {
    this.mounted.set(blockerId, !this.isMounted(blockerId));
    this.bump();
  }

  isArmed(blockerId: BlockerId): boolean {
    return !this.disarmed.has(blockerId);
  }

  toggleArm(blockerId: BlockerId) {
    if (this.disarmed.has(blockerId)) {
      this.disarmed.delete(blockerId);
    } else {
      this.disarmed.add(blockerId);
    }
    this.bump();
  }

  // --- probe co-plugin ---

  probeCall(hook: string): number {
    const count = (this.probeCounts.get(hook) ?? 0) + 1;
    this.probeCounts.set(hook, count);
    const entry: ProbeLogEntry = { hook, count };
    this.probeLog.push(entry);
    this.bump();
    return count;
  }
}

export const harnessStore = new HarnessStore();

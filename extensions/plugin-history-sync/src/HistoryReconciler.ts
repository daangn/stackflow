import { Action, type History, type Update } from "history";
import {
  BrowserHistoryEntryModel,
  type HistoryEntryIdentity,
  identityEquals,
  identityOfState,
} from "./BrowserHistoryEntryModel";
import type { DesiredHistoryEntry } from "./desiredHistoryEntries";
import type { HistoryQueueContextValue } from "./HistoryQueueContext";
import {
  parseState,
  pushState,
  replaceState,
  type State,
} from "./historyState";
import { Mutex } from "./Mutex";

/**
 * An unexpected contradiction between the model and the real browser history
 * (an operation that cannot be expressed, or one that never completed). These
 * are programming-error/desync conditions — expected situations (prevented
 * navigations, unknown entries, out-of-app cursor) never raise this.
 */
class HistorySyncDesyncError extends Error {
  constructor(message: string) {
    super(`[plugin-history-sync] ${message}`);
    this.name = "HistorySyncDesyncError";
  }
}

/**
 * Raised into pending operations when the reconciler is suspended (last
 * `<Stack />` unmounted). This is a normal teardown path, not an error.
 */
class ReconcilerSuspendedError extends Error {
  constructor() {
    super("[plugin-history-sync] reconciler suspended");
    this.name = "ReconcilerSuspendedError";
  }
}

type GoExpectation = {
  targetIndex: number;
  expectedIdentity: HistoryEntryIdentity | null;
  resolve: () => void;
  reject: (error: Error) => void;
};

type ReconcileOp =
  | { type: "go"; targetIndex: number }
  | { type: "replace"; entry: DesiredHistoryEntry; index: number }
  | { type: "push"; entry: DesiredHistoryEntry; index: number };

/**
 * Upper bound for one reconcile pass. Each iteration performs at most one
 * history operation, and a stable stack converges within `desired.length`
 * operations — hitting this bound means the stack/browser pair keeps moving
 * away faster than we converge, which is a desync.
 */
const MAX_RECONCILE_ITERATIONS = 100;

/**
 * A `history.go()` that never produces a `popstate` would block the serial
 * queue forever. Out-of-range calls are rejected up front by model bounds
 * checks; this timeout is the last-resort guard for cases the model cannot
 * predict (e.g. an embedder truncating the history behind our back).
 */
const GO_TIMEOUT_MS = 10_000;

export class HistoryReconciler {
  private history: History;
  private useHash?: boolean;
  private computeDesired: () => DesiredHistoryEntry[];
  private onExternalPopState: (state: State | null) => void;

  readonly model = new BrowserHistoryEntryModel();

  private taskQueue = new Mutex();
  private expectation: GoExpectation | null = null;
  private reconcileScheduled = false;
  private resyncing = false;
  private listening: (() => void) | null = null;
  private suspended = false;
  private retainCount = 0;

  constructor({
    history,
    useHash,
    computeDesired,
    onExternalPopState,
  }: {
    history: History;
    useHash?: boolean;
    computeDesired: () => DesiredHistoryEntry[];
    onExternalPopState: (state: State | null) => void;
  }) {
    this.history = history;
    this.useHash = useHash;
    this.computeDesired = computeDesired;
    this.onExternalPopState = onExternalPopState;
  }

  /**
   * Boot on an entry without a serialized state: the current (external)
   * entry is replaced by the root desired entry and the remaining desired
   * entries are pushed on top, all synchronously. Index `0` is defined as
   * the boot entry.
   */
  initializeFreshBoot(desired: DesiredHistoryEntry[]): void {
    this.model.seed({ currentIndex: 0, anchorIndex: 0 });

    desired.forEach((entry, index) => {
      if (index === 0) {
        this.writeReplace(entry, 0);
      } else {
        this.writePush(entry, index);
      }
    });
  }

  /**
   * Boot on an entry carrying a serialized state (reload / re-entry). The
   * browser history already holds this session's ancestors plus possibly
   * entries from previous sessions; nothing is written. States serialized by
   * older plugin versions carry no `entryIndex` — the coordinate system is
   * then re-based on the current entry, which is upgraded in place.
   */
  initializeRestored(state: State, desired: DesiredHistoryEntry[]): void {
    const hasEntryIndex = typeof state.entryIndex === "number";
    const currentIndex = hasEntryIndex ? state.entryIndex! : 0;

    this.model.seed({
      currentIndex,
      anchorIndex: currentIndex - Math.max(desired.length - 1, 0),
    });
    this.model.learnEntry(currentIndex, {
      identity: identityOfState(state),
      state,
    });

    if (!hasEntryIndex && desired.length > 0) {
      this.writeReplace(desired[desired.length - 1], currentIndex);
    }
  }

  /**
   * Starts listening to the history instance. Safe to call repeatedly.
   */
  start(): void {
    this.suspended = false;

    if (this.listening) {
      return;
    }

    this.listening = this.history.listen((update) => {
      this.handleHistoryUpdate(update);
    });
  }

  /**
   * Reference counting for mounted `<Stack />` components. When the last one
   * unmounts, the reconciler stops listening and rejects in-flight
   * operations (a normal teardown, handled silently). The microtask deferral
   * keeps React StrictMode's synchronous cleanup/re-run cycle from tearing
   * the listener down.
   */
  retain(): void {
    this.retainCount += 1;
    this.start();
    // The stack may have been dispatched to while no <Stack /> was mounted
    // (reconciliation is suspended then — core actions stay usable);
    // converge on (re-)mount. A no-op pass when already consistent.
    this.requestReconcile();
  }

  release(): void {
    this.retainCount -= 1;

    queueMicrotask(() => {
      if (this.retainCount <= 0 && !this.suspended) {
        this.suspend();
      }
    });
  }

  private suspend(): void {
    this.suspended = true;
    this.reconcileScheduled = false;
    this.listening?.();
    this.listening = null;

    const expectation = this.expectation;
    this.expectation = null;
    expectation?.reject(new ReconcilerSuspendedError());
  }

  /**
   * Schedules a reconcile pass on the serial queue. Multiple requests
   * coalesce into one pending pass; a pass always recomputes the desired
   * entries from the latest stack, so changes that arrive while a pass is
   * queued are folded into it.
   */
  requestReconcile(): void {
    if (this.reconcileScheduled || this.suspended) {
      return;
    }

    this.reconcileScheduled = true;
    this.enqueue(async () => {
      this.reconcileScheduled = false;
      await this.reconcileOnce();
      this.resyncing = false;
    });
  }

  /**
   * Legacy serialized-history-task contract kept for `HistoryQueueContext`
   * consumers: runs `cb` exclusively on the same queue as reconcile
   * operations, completing on the next history tick or on explicit resolve.
   */
  requestHistoryTick: HistoryQueueContextValue["requestHistoryTick"] = (cb) => {
    this.enqueue(
      () =>
        new Promise<void>((resolve) => {
          const clean = this.history.listen(() => {
            clean();
            resolve();
          });

          cb(() => {
            clean();
            resolve();
          });
        }),
    );
  };

  private enqueue(task: () => Promise<void>): void {
    this.taskQueue.runExclusively(async () => {
      if (this.suspended) {
        return;
      }

      try {
        await task();
      } catch (error) {
        if (error instanceof ReconcilerSuspendedError || this.suspended) {
          return;
        }

        console.error(
          "[plugin-history-sync] history reconciliation failed; attempting to resynchronize from the current browser entry",
          error,
        );
        this.attemptResync();
      }
    });
  }

  /**
   * Last-resort recovery from a desync: rebuild the model from the only
   * ground truth still available — the current entry's serialized state —
   * then reconcile again. A second consecutive failure gives up loudly and
   * waits for the next external event instead of looping.
   */
  private attemptResync(): void {
    if (this.resyncing) {
      console.error(
        "[plugin-history-sync] resynchronization failed twice in a row; suspending history writes until the next navigation",
      );
      return;
    }

    this.resyncing = true;

    const state = parseState(this.history.location.state);

    if (!state) {
      this.model.markOutOfApp();
      return;
    }

    const desired = this.computeDesired();
    const currentIndex =
      typeof state.entryIndex === "number"
        ? state.entryIndex
        : this.model.currentIndex;

    this.model.seed({
      currentIndex,
      anchorIndex: currentIndex - Math.max(desired.length - 1, 0),
    });
    this.model.learnEntry(currentIndex, {
      identity: identityOfState(state),
      state,
    });
    this.requestReconcile();
  }

  private handleHistoryUpdate(update: Update): void {
    if (update.action !== Action.Pop) {
      // Push/Replace updates through this History instance are either our
      // own writes (already recorded in the model) or out-of-contract
      // mutations by external code; neither is a navigation to interpret.
      return;
    }

    const state = parseState(update.location.state);

    if (this.consumeExpectation(state)) {
      return;
    }

    try {
      this.onExternalPopState(state);
    } finally {
      // Converge unconditionally: if the navigation was prevented the stack
      // did not change, and reconciliation restores the browser to it.
      this.requestReconcile();
    }
  }

  private consumeExpectation(state: State | null): boolean {
    const expectation = this.expectation;

    if (!expectation || !state) {
      return false;
    }

    const matches =
      typeof state.entryIndex === "number"
        ? state.entryIndex === expectation.targetIndex
        : expectation.expectedIdentity !== null &&
          identityEquals(identityOfState(state), expectation.expectedIdentity);

    if (!matches) {
      return false;
    }

    this.expectation = null;
    // Move the cursor before resolving so that any synchronously following
    // popstate handler reads an up-to-date model.
    this.model.moveCursor(expectation.targetIndex);
    this.model.learnEntry(expectation.targetIndex, {
      identity: identityOfState(state),
      state,
    });
    expectation.resolve();

    return true;
  }

  /**
   * One reconcile pass: converge the browser history onto the desired
   * entries. Each iteration recomputes both sides and performs at most one
   * history operation, which makes the pass robust against re-entrant stack
   * dispatches and user navigations that interleave with our own operations.
   */
  private async reconcileOnce(): Promise<void> {
    for (let iteration = 0; iteration < MAX_RECONCILE_ITERATIONS; iteration++) {
      if (this.suspended || this.model.outOfApp) {
        return;
      }

      const desired = this.computeDesired();

      if (desired.length === 0) {
        // Transient stack state (e.g. teardown or initial setup in flight);
        // there is nothing to converge onto.
        return;
      }

      const op = this.planNextOp(desired);

      if (op === null) {
        return;
      }

      await this.executeOp(op, desired);
    }

    throw new HistorySyncDesyncError(
      "reconciliation did not converge; the stack and the browser history keep diverging",
    );
  }

  private planNextOp(desired: DesiredHistoryEntry[]): ReconcileOp | null {
    const anchorIndex = this.model.anchorIndex;

    for (let j = 0; j < desired.length; j++) {
      const index = anchorIndex + j;

      if (!this.model.exists(index)) {
        // The entry does not exist yet: position the cursor on its
        // predecessor (which must exist) and push from there.
        const appendBase = index - 1;

        if (appendBase < anchorIndex) {
          // The anchor entry itself is missing — the model lost track of the
          // root, which initialization is supposed to guarantee.
          throw new HistorySyncDesyncError(
            `cannot append below the anchor (anchor=${anchorIndex}, append base=${appendBase})`,
          );
        }

        if (this.model.currentIndex !== appendBase) {
          return { type: "go", targetIndex: appendBase };
        }

        return { type: "push", entry: desired[j], index };
      }

      const known = this.model.getEntry(index);

      // Unknown entries (written by previous sessions) are treated as
      // matching — they are restoration targets and must never be rewritten.
      // Known entries diverge on identity, or on path when the identity is
      // unchanged but the entry was rewritten with different params (e.g. an
      // in-place replace reusing the activityId). A `null` known path means
      // the entry was only observed, never written — observed entries are
      // never rewritten for path-only differences, with one exception: the
      // *current* entry is rewritten when its recorded entry event differs
      // from the desired one (an in-place replace right after a reload, when
      // nothing has been written yet). Rewriting the entry the cursor rests
      // on never destroys a restoration target.
      const diverges =
        known !== undefined &&
        (!identityEquals(known.identity, {
          activityId: desired[j].activityId,
          stepId: desired[j].stepId,
        }) ||
          (known.path !== null && known.path !== desired[j].path) ||
          (known.path === null &&
            index === this.model.currentIndex &&
            known.state.activity.enteredBy.id !==
              desired[j].state.activity.enteredBy.id));

      if (diverges) {
        const targetCursor = anchorIndex + desired.length - 1;

        // A divergent rewrite of the *last* desired entry while entries this
        // session itself wrote linger above it means that suffix is a stale
        // branch our own navigation produced (e.g. a replace that shrank the
        // entry list). Rebuild the entry with a push so the browser
        // truncates the whole branch. Observed-only/previous-session
        // suffixes (no recorded path) keep the optimistic invariant and the
        // in-place rewrite below — they are restoration targets. The root
        // entry can only be rewritten in place (nothing to push from).
        const mustTruncateStaleSuffix =
          index === targetCursor &&
          index > anchorIndex &&
          this.model.hasWrittenEntriesAbove(index);

        if (this.model.currentIndex < index || mustTruncateStaleSuffix) {
          // The divergent entry lies ahead of the cursor (a stale forward
          // branch — e.g. entries left over from before a browser back), or
          // it must cut a stale suffix: rebuild it with a push, per standard
          // pushState truncation semantics. Never walk forward into a stale
          // branch — entries between the cursor and the branch point were
          // verified matching by this scan, so positioning on the
          // predecessor is safe.
          if (this.model.currentIndex !== index - 1) {
            return { type: "go", targetIndex: index - 1 };
          }

          return { type: "push", entry: desired[j], index };
        }

        if (this.model.currentIndex > index) {
          // The divergent entry is behind the cursor: move back to it and
          // rewrite it in place on the next iteration. (`replaceState`
          // preserves entries beyond it — those are still desired here, and
          // get repaired index by index on subsequent iterations.)
          return { type: "go", targetIndex: index };
        }

        return { type: "replace", entry: desired[j], index };
      }
    }

    const targetCursor = anchorIndex + desired.length - 1;

    if (this.model.currentIndex !== targetCursor) {
      return { type: "go", targetIndex: targetCursor };
    }

    return null;
  }

  private async executeOp(
    op: ReconcileOp,
    desired: DesiredHistoryEntry[],
  ): Promise<void> {
    switch (op.type) {
      case "go": {
        if (
          op.targetIndex < this.model.anchorIndex ||
          !this.model.exists(op.targetIndex)
        ) {
          throw new HistorySyncDesyncError(
            `go target out of the app-owned range (target=${op.targetIndex}, anchor=${this.model.anchorIndex}, top=${this.model.topIndex})`,
          );
        }

        const desiredPosition = op.targetIndex - this.model.anchorIndex;
        const expectedIdentity: HistoryEntryIdentity | null =
          this.model.getEntry(op.targetIndex)?.identity ??
          (desiredPosition >= 0 && desiredPosition < desired.length
            ? {
                activityId: desired[desiredPosition].activityId,
                stepId: desired[desiredPosition].stepId,
              }
            : null);

        await this.executeGo(op.targetIndex, expectedIdentity);
        return;
      }
      case "replace": {
        this.writeReplace(op.entry, op.index);
        return;
      }
      case "push": {
        this.writePush(op.entry, op.index);
        return;
      }
    }
  }

  private executeGo(
    targetIndex: number,
    expectedIdentity: HistoryEntryIdentity | null,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.expectation?.targetIndex === targetIndex) {
          this.expectation = null;
          reject(
            new HistorySyncDesyncError(
              `history.go(${targetIndex - this.model.currentIndex}) produced no popstate within ${GO_TIMEOUT_MS}ms`,
            ),
          );
        }
      }, GO_TIMEOUT_MS);

      this.expectation = {
        targetIndex,
        expectedIdentity,
        resolve: () => {
          clearTimeout(timeout);
          resolve();
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      };

      // The expectation is registered before issuing the operation: memory
      // histories notify listeners synchronously inside `go()`.
      this.history.go(targetIndex - this.model.currentIndex);
    });
  }

  private writePush(entry: DesiredHistoryEntry, index: number): void {
    const state: State = { ...entry.state, entryIndex: index };

    pushState({
      history: this.history,
      pathname: entry.path,
      state,
      useHash: this.useHash,
    });
    this.model.recordPush({
      identity: { activityId: entry.activityId, stepId: entry.stepId },
      state,
      path: entry.path,
    });
  }

  private writeReplace(entry: DesiredHistoryEntry, index: number): void {
    const state: State = { ...entry.state, entryIndex: index };

    replaceState({
      history: this.history,
      pathname: entry.path,
      state,
      useHash: this.useHash,
    });
    this.model.recordReplace({
      identity: { activityId: entry.activityId, stepId: entry.stepId },
      state,
      path: entry.path,
    });
  }
}

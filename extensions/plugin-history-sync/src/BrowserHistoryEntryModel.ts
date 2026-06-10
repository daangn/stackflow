import type { State } from "./historyState";
import { getStateStepId } from "./historyState";

export interface HistoryEntryIdentity {
  activityId: string;
  stepId: string;
}

export interface KnownHistoryEntry {
  identity: HistoryEntryIdentity;

  /**
   * The state observed (or written) for this entry. Kept so that forward
   * navigation across multiple entries can replay intermediate entries from
   * their snapshots.
   */
  state: State;

  /**
   * The canonical path this plugin last wrote for the entry, or `null` when
   * the entry was only observed through a popstate. Lets the reconciler
   * detect param-only divergence (same activity/step identity, different
   * URL — e.g. an in-place replace that reuses the activityId) without ever
   * rewriting entries it merely visited.
   */
  path: string | null;
}

export function identityOfState(state: State): HistoryEntryIdentity {
  return {
    activityId: state.activity.id,
    stepId: getStateStepId(state),
  };
}

export function identityEquals(
  a: HistoryEntryIdentity,
  b: HistoryEntryIdentity,
): boolean {
  return a.activityId === b.activityId && a.stepId === b.stepId;
}

/**
 * The plugin's model of the actual browser history ("actual" side of the
 * reconciliation). Indexes are absolute in the plugin's own coordinate
 * system: `0` is the entry that was current when the app booted fresh, or the
 * persisted `entryIndex` of the current entry when the app booted from a
 * serialized state.
 *
 * The model is intentionally allowed to be *partial*: entries written or
 * visited during this session are known; entries written by previous sessions
 * (still restorable through their serialized states) stay unknown until a
 * `popstate` reveals them. The reconciler treats unknown entries
 * optimistically and never rewrites them, which is what preserves
 * cross-reload back/forward restoration.
 */
export class BrowserHistoryEntryModel {
  private knownEntries = new Map<number, KnownHistoryEntry>();
  private _currentIndex = 0;
  private _topIndex = 0;
  private _anchorIndex = 0;
  private _outOfApp = false;

  /**
   * Cursor position in the browser history.
   */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /**
   * The highest index this model believes to exist in the browser history.
   */
  get topIndex(): number {
    return this._topIndex;
  }

  /**
   * The absolute index the first desired entry maps to. The desired entries
   * occupy `[anchorIndex, anchorIndex + desired.length - 1]`; everything
   * below the anchor (external entries that predate the app, or entries of
   * previous sessions not yet re-learned) must never be touched by the
   * reconciler.
   */
  get anchorIndex(): number {
    return this._anchorIndex;
  }

  /**
   * True while the browser cursor rests on an entry that does not belong to
   * the app (no parseable state) — e.g. the user navigated back past the
   * app's first entry. Reconciliation is suspended until the cursor returns
   * to an app entry.
   */
  get outOfApp(): boolean {
    return this._outOfApp;
  }

  seed({
    currentIndex,
    anchorIndex,
  }: {
    currentIndex: number;
    anchorIndex: number;
  }): void {
    this.knownEntries.clear();
    this._currentIndex = currentIndex;
    this._topIndex = currentIndex;
    this._anchorIndex = anchorIndex;
    this._outOfApp = false;
  }

  setAnchorIndex(anchorIndex: number): void {
    this._anchorIndex = anchorIndex;
  }

  getEntry(index: number): KnownHistoryEntry | undefined {
    return this.knownEntries.get(index);
  }

  /**
   * Whether the model believes an entry exists at `index` (it may still be
   * unknown — written by a previous session).
   */
  exists(index: number): boolean {
    return index <= this._topIndex;
  }

  /**
   * Whether any entry above `index` was *written* by this session (carries a
   * recorded path). Such entries are this session's own product — when they
   * stop being desired they are a stale branch that may be truncated, unlike
   * observed-only/previous-session entries, which must be preserved as
   * restoration targets.
   */
  hasWrittenEntriesAbove(index: number): boolean {
    for (const [entryIndex, entry] of this.knownEntries) {
      if (entryIndex > index && entry.path !== null) {
        return true;
      }
    }

    return false;
  }

  learnEntry(
    index: number,
    entry: Omit<KnownHistoryEntry, "path"> & { path?: string | null },
  ): void {
    // Observations never erase the written-path knowledge of an entry.
    const path = entry.path ?? this.knownEntries.get(index)?.path ?? null;

    this.knownEntries.set(index, { ...entry, path });

    if (index > this._topIndex) {
      this._topIndex = index;
    }
  }

  moveCursor(index: number): void {
    this._currentIndex = index;
    this._outOfApp = false;
  }

  markOutOfApp(): void {
    this._outOfApp = true;
  }

  /**
   * Records the effect of a `pushState` issued by the reconciler: the cursor
   * advances and every entry beyond it is truncated by the browser.
   */
  recordPush(entry: KnownHistoryEntry): void {
    const nextIndex = this._currentIndex + 1;

    for (const index of this.knownEntries.keys()) {
      if (index >= nextIndex) {
        this.knownEntries.delete(index);
      }
    }

    this._currentIndex = nextIndex;
    this._topIndex = nextIndex;
    this.knownEntries.set(nextIndex, entry);
  }

  /**
   * Records the effect of a `replaceState` issued by the reconciler.
   */
  recordReplace(entry: KnownHistoryEntry): void {
    this.knownEntries.set(this._currentIndex, entry);
  }
}

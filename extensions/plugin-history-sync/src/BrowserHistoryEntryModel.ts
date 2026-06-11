import type { State } from "./historyState";
import { getStateStepId } from "./historyState";

export interface HistoryEntryIdentity {
  activityId: string;
  stepId: string;
}

/**
 * How the model came to know an entry. Only entries this session itself
 * wrote (`"session-write"`) are ever eligible for rewriting/truncation when
 * they diverge from the desired entries — they are this session's own
 * product. Entries restored from the journal (`"journal"`, written by a
 * previous session of this tab) and entries merely observed through a
 * popstate (`"observation"`) are restoration targets and stay protected:
 * being visited or journaled must never lift the protection.
 */
export type HistoryEntryProvenance =
  | "session-write"
  | "journal"
  | "observation";

export interface KnownHistoryEntry {
  identity: HistoryEntryIdentity;

  /**
   * The state observed (or written) for this entry. Kept so that forward
   * navigation across multiple entries can replay intermediate entries from
   * their snapshots, and so that backward navigation can replay restored
   * chains historically.
   */
  state: State;

  /**
   * The canonical path this plugin knows for the entry (written this
   * session or restored from the journal), or `null` when the entry was
   * only observed through a popstate. Lets the reconciler detect param-only
   * divergence (same activity/step identity, different URL — e.g. an
   * in-place replace that reuses the activityId).
   */
  path: string | null;

  provenance: HistoryEntryProvenance;
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
 * `popstate` reveals them or the journal restores them at boot. The
 * reconciler treats unknown entries optimistically and never rewrites them —
 * nor any known entry this session did not write itself (see
 * `HistoryEntryProvenance`) — which is what preserves cross-reload
 * back/forward restoration.
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
   * Whether any entry above `index` was *written* by this session. Such
   * entries are this session's own product — when they stop being desired
   * they are a stale branch that may be truncated, unlike observed-only and
   * journal-restored (previous-session) entries, which must be preserved as
   * restoration targets.
   */
  hasWrittenEntriesAbove(index: number): boolean {
    for (const [entryIndex, entry] of this.knownEntries) {
      if (entryIndex > index && entry.provenance === "session-write") {
        return true;
      }
    }

    return false;
  }

  learnEntry(
    index: number,
    entry: Omit<KnownHistoryEntry, "path" | "provenance"> & {
      path?: string | null;
    },
  ): void {
    const known = this.knownEntries.get(index);
    // Observations never erase the written-path knowledge of an entry, and
    // never downgrade a session-write/journal provenance — visiting an entry
    // must not lift its protection (nor grant rewrite eligibility).
    const path = entry.path ?? known?.path ?? null;
    const provenance = known?.provenance ?? "observation";

    this.knownEntries.set(index, { ...entry, path, provenance });

    if (index > this._topIndex) {
      this._topIndex = index;
    }
  }

  /**
   * Seeds an entry restored from the journal (written by a previous session
   * of this tab). Deliberately does *not* raise `topIndex`: journal
   * knowledge serves restoration and replay, but must not make the
   * reconciler believe forward entries exist — a push right after boot has
   * to truncate a stale forward branch via standard `pushState` semantics,
   * exactly like the optimistic no-journal boot does. Physical confirmation
   * that an entry exists arrives with the `popstate` that lands on it.
   */
  restoreJournalEntry(
    index: number,
    entry: Omit<KnownHistoryEntry, "provenance">,
  ): void {
    this.knownEntries.set(index, { ...entry, provenance: "journal" });
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
  recordPush(entry: Omit<KnownHistoryEntry, "provenance">): void {
    const nextIndex = this._currentIndex + 1;

    for (const index of this.knownEntries.keys()) {
      if (index >= nextIndex) {
        this.knownEntries.delete(index);
      }
    }

    this._currentIndex = nextIndex;
    this._topIndex = nextIndex;
    this.knownEntries.set(nextIndex, { ...entry, provenance: "session-write" });
  }

  /**
   * Records the effect of a `replaceState` issued by the reconciler.
   */
  recordReplace(entry: Omit<KnownHistoryEntry, "provenance">): void {
    this.knownEntries.set(this._currentIndex, {
      ...entry,
      provenance: "session-write",
    });
  }
}

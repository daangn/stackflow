import { parse, stringify } from "flatted";
import {
  type HistoryEntryIdentity,
  identityEquals,
  identityOfState,
} from "./BrowserHistoryEntryModel";
import type { State } from "./historyState";

const JOURNAL_STORAGE_KEY = "@stackflow/plugin-history-sync::entry-journal";
const JOURNAL_FORMAT_VERSION = 1;

export interface JournalEntryRecord {
  state: State;
  path: string;
}

interface JournalPayload {
  version: typeof JOURNAL_FORMAT_VERSION;
  entries: Array<[number, JournalEntryRecord]>;
}

function isJournalEntryRecord(input: unknown): input is JournalEntryRecord {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const record = input as Partial<JournalEntryRecord>;

  return (
    typeof record.path === "string" &&
    typeof record.state === "object" &&
    record.state !== null &&
    typeof record.state.activity === "object" &&
    record.state.activity !== null &&
    typeof record.state.activity.id === "string"
  );
}

function isJournalPayload(input: unknown): input is JournalPayload {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const payload = input as Partial<JournalPayload>;

  return (
    payload.version === JOURNAL_FORMAT_VERSION &&
    Array.isArray(payload.entries) &&
    payload.entries.every(
      (pair) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        typeof pair[0] === "number" &&
        isJournalEntryRecord(pair[1]),
    )
  );
}

/**
 * Persistent record of the browser history entries this app wrote during the
 * current tab session (the tab session shares its lifetime with the browser
 * history itself, hence `sessionStorage`). Serialized with `flatted`, the
 * same codec `historyState.ts` uses for per-entry states, so restoration
 * fidelity is identical.
 *
 * The journal lets a reloaded session re-learn entries it can no longer see
 * through the History API: which entries exist behind/ahead of the current
 * one, their activity/step identities, their original entry-event snapshots
 * (for historical replay) and canonical paths.
 *
 * The in-memory map is the source of truth and every persist overwrites the
 * full payload, so a storage failure can only ever freeze a consistent
 * snapshot — never produce a partially-updated one. Boot-time validation
 * (current entry identity + format version) arbitrates whether a stored
 * snapshot still describes the live browser history; anything else falls
 * back to the optimistic no-journal behavior.
 *
 * Journal failures are expected conditions (quota, privacy modes, embedders
 * without storage): the journal degrades to a no-op with a one-time
 * diagnostic and must never block reconciliation. Environments that simply
 * lack storage (SSR, memory history) are silent no-ops by construction.
 */
export class HistoryEntryJournal {
  private getStorage: () => Storage | undefined;
  private enabled: boolean;
  private entries = new Map<number, JournalEntryRecord>();
  private warned = false;

  constructor({
    enabled,
    getStorage,
  }: {
    enabled: boolean;
    getStorage: () => Storage | undefined;
  }) {
    this.enabled = enabled;
    this.getStorage = getStorage;
  }

  /**
   * Reads the persisted journal and validates it against the entry the app
   * booted on. Returns the journaled entries on success; `null` means "boot
   * without journal knowledge" (cold start, different coordinate system,
   * corrupt data, storage unavailable). Invalid persisted data is cleared so
   * that this session's writes start a coherent journal.
   */
  loadValidated({
    expectedIndex,
    expectedIdentity,
  }: {
    expectedIndex: number;
    expectedIdentity: HistoryEntryIdentity;
  }): ReadonlyMap<number, JournalEntryRecord> | null {
    const storage = this.safeGetStorage();

    if (!storage) {
      return null;
    }

    let raw: string | null;

    try {
      raw = storage.getItem(JOURNAL_STORAGE_KEY);
    } catch (error) {
      this.warnOnce("the history entry journal could not be read", error);
      return null;
    }

    if (raw === null) {
      // Cold start (first visit in this tab) — expected, no diagnostic.
      return null;
    }

    let payload: unknown;

    try {
      payload = parse(raw);
    } catch (error) {
      this.warnOnce("the persisted history entry journal is corrupt", error);
      this.reset();
      return null;
    }

    if (!isJournalPayload(payload)) {
      this.warnOnce(
        "the persisted history entry journal has an unknown format",
      );
      this.reset();
      return null;
    }

    const entries = new Map(payload.entries);
    const currentRecord = entries.get(expectedIndex);

    if (
      !currentRecord ||
      !identityEquals(identityOfState(currentRecord.state), expectedIdentity)
    ) {
      // The journal describes a different history (another app instance on
      // the same origin, external history manipulation, ...). Start over.
      this.warnOnce(
        "the persisted history entry journal does not match the current history entry",
      );
      this.reset();
      return null;
    }

    this.entries = entries;

    return entries;
  }

  /**
   * A fresh boot defines a new coordinate system (index `0` becomes the boot
   * entry), so whatever journal a previous session left behind no longer
   * describes this history. The journal restarts from this session's writes.
   */
  resetForFreshBoot(): void {
    this.reset();
  }

  /**
   * Mirrors a reconciler write into the journal. A `pushState` truncates
   * every entry beyond the written one (standard history semantics); a
   * `replaceState` only updates its own slot.
   */
  recordWrite(
    index: number,
    record: JournalEntryRecord,
    { truncateAbove }: { truncateAbove: boolean },
  ): void {
    if (!this.enabled) {
      return;
    }

    if (truncateAbove) {
      for (const entryIndex of this.entries.keys()) {
        if (entryIndex > index) {
          this.entries.delete(entryIndex);
        }
      }
    }

    this.entries.set(index, record);
    this.persist();
  }

  private reset(): void {
    this.entries.clear();

    const storage = this.safeGetStorage();

    if (!storage) {
      return;
    }

    try {
      storage.removeItem(JOURNAL_STORAGE_KEY);
    } catch (error) {
      // A later successful persist overwrites the stale payload anyway.
      this.warnOnce("the history entry journal could not be cleared", error);
    }
  }

  private persist(): void {
    const storage = this.safeGetStorage();

    if (!storage) {
      return;
    }

    const payload: JournalPayload = {
      version: JOURNAL_FORMAT_VERSION,
      entries: Array.from(this.entries.entries()),
    };

    try {
      storage.setItem(JOURNAL_STORAGE_KEY, stringify(payload));
    } catch (error) {
      // Quota/privacy failures freeze the last consistent snapshot; the next
      // boot's validation decides whether it is still usable. Keep trying —
      // a later write may succeed and self-heal (full overwrite).
      this.warnOnce("the history entry journal could not be persisted", error);
    }
  }

  private safeGetStorage(): Storage | undefined {
    if (!this.enabled) {
      return undefined;
    }

    try {
      // The property access itself may throw (e.g. a SecurityError in
      // third-party iframes or hardened privacy settings).
      return this.getStorage();
    } catch (error) {
      this.warnOnce("sessionStorage is not accessible", error);
      return undefined;
    }
  }

  private warnOnce(message: string, error?: unknown): void {
    if (this.warned) {
      return;
    }

    this.warned = true;
    console.warn(
      `[plugin-history-sync] ${message}; cross-reload restoration falls back to per-entry optimistic behavior`,
      ...(error === undefined ? [] : [error]),
    );
  }
}

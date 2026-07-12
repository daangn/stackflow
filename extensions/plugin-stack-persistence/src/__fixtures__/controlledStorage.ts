import type {
  StackSnapshotRecord,
  StackSnapshotStorage,
} from "@stackflow/plugin-stack-persistence";

export type ControlledSaveCall<Metadata> = {
  record: StackSnapshotRecord<Metadata>;
  state: "pending" | "resolved" | "rejected";
  /** Completes this write: the record becomes visible to later `load()`s. */
  resolve: () => void;
  /** Fails this write with the given reason. */
  reject: (reason: unknown) => void;
};

export type ControlledStorage<Metadata = undefined> = {
  storage: StackSnapshotStorage<Metadata>;
  /** One entry per `save()` call, in call order. */
  saveCalls: ControlledSaveCall<Metadata>[];
  readonly loadCallCount: number;
  /** The record a subsequent `load()` would return right now. */
  readonly completedRecord: StackSnapshotRecord<Metadata> | null;
  /** Replaces the stored record out of band (test setup only). */
  setStoredRecord: (record: StackSnapshotRecord<Metadata> | null) => void;
};

/**
 * Storage test double honoring the `StackSnapshotStorage` contract:
 * synchronous `load()`, per-call deferred `save()` promises that the test
 * settles explicitly. Only records whose write was completed are exposed
 * to later `load()`s — a called-but-pending write is not durable. As the
 * contract requires of a storage implementor, writes are tracked in call
 * order and a failed write never stops later ones from being processed
 * (each call gets an independent deferred).
 *
 * When `loadError` is given, `load()` throws it — simulating a failing
 * read. `autoComplete` resolves every write immediately, for tests where
 * write timing is irrelevant.
 */
export function makeControlledStorage<Metadata = undefined>(
  options: {
    initialRecord?: StackSnapshotRecord<Metadata> | null;
    loadError?: unknown;
    autoComplete?: boolean;
    /** Shared call-order log; entries are `storage.load` / `storage.save`. */
    callLog?: string[];
  } = {},
): ControlledStorage<Metadata> {
  let storedRecord = options.initialRecord ?? null;
  let loadCallCount = 0;
  const saveCalls: ControlledSaveCall<Metadata>[] = [];

  const storage: StackSnapshotStorage<Metadata> = {
    load() {
      loadCallCount += 1;
      options.callLog?.push("storage.load");

      if (options.loadError !== undefined) {
        throw options.loadError;
      }

      return storedRecord;
    },
    save(record) {
      options.callLog?.push("storage.save");

      let resolvePromise!: () => void;
      let rejectPromise!: (reason: unknown) => void;
      const promise = new Promise<void>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
      });

      const call: ControlledSaveCall<Metadata> = {
        record,
        state: "pending",
        resolve() {
          if (call.state !== "pending") {
            throw new Error("this save call was already settled by the test");
          }
          call.state = "resolved";
          storedRecord = record;
          resolvePromise();
        },
        reject(reason) {
          if (call.state !== "pending") {
            throw new Error("this save call was already settled by the test");
          }
          call.state = "rejected";
          rejectPromise(reason);
        },
      };

      saveCalls.push(call);

      if (options.autoComplete) {
        call.resolve();
      }

      return promise;
    },
  };

  return {
    storage,
    saveCalls,
    get loadCallCount() {
      return loadCallCount;
    },
    get completedRecord() {
      return storedRecord;
    },
    setStoredRecord(record) {
      storedRecord = record;
    },
  };
}

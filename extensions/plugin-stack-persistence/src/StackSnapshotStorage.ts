import type { StackSnapshotRecord } from "./StackSnapshotRecord";

/**
 * Consumer-provided persistence boundary. The plugin knows nothing about the
 * medium, encoding, or namespacing behind it.
 *
 * - `load()` returns a prepared record synchronously (`null` when there is
 *   nothing to restore). Consumers on asynchronous media finish reading
 *   before connecting the storage to Stackflow — the plugin never exposes a
 *   default stack first and swaps it with an async restore result.
 * - `save(record)` always returns `Promise<void>`, and reports every failure
 *   as a rejected promise. A storage that throws synchronously from `save`
 *   is violating this contract, and the plugin does not guarantee that such
 *   a violation is normalized into `onSaveError`.
 * - Write requests must be processed in call order, and requests after a
 *   failed one must still be processed. That ordering is the storage
 *   implementor's contract, not the plugin's.
 */
export interface StackSnapshotStorage<Metadata = undefined> {
  load(): StackSnapshotRecord<Metadata> | null;
  save(record: StackSnapshotRecord<Metadata>): Promise<void>;
}

/**
 * Contract: without a strategy, the storage's metadata type is
 * `undefined`. A metadata-carrying storage cannot be passed alone.
 */

import type { StackSnapshotStorage } from "@stackflow/plugin-stack-persistence";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";

declare const plainStorage: StackSnapshotStorage<undefined>;
declare const verStorage: StackSnapshotStorage<{ version: number }>;

// Positive: a metadata-less storage needs no strategy.
stackPersistencePlugin({ storage: plainStorage });

// @ts-expect-error strategy 없이 metadata 있는 storage는 거부된다
stackPersistencePlugin({ storage: verStorage });

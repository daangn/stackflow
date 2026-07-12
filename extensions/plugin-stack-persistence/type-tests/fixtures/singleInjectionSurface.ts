/**
 * Contract: v1 options express one injected storage, at most one optional
 * strategy, and automatic saving only — no storage/strategy arrays and no
 * manual lifecycle surface (saveNow/flush/unload-blocker/delete/TTL).
 */

import type {
  StackSnapshotStorage,
  StackSnapshotStrategy,
} from "@stackflow/plugin-stack-persistence";
import { stackPersistencePlugin } from "@stackflow/plugin-stack-persistence";

declare const storage: StackSnapshotStorage;
declare const otherStorage: StackSnapshotStorage;
declare const strategy: StackSnapshotStrategy<undefined>;

// Positive: one storage, optionally one strategy.
stackPersistencePlugin({ storage });
stackPersistencePlugin({ storage, strategy });

// --- negative controls ---

// @ts-expect-error storage 배열이 아니라 단일 storage만 받는다
stackPersistencePlugin({ storage: [storage, otherStorage] });

// @ts-expect-error strategy 배열이 아니라 단일 strategy만 받는다
stackPersistencePlugin({ storage, strategy: [strategy, strategy] });

// @ts-expect-error 수동 저장 API(saveNow)를 표현하지 않는다
stackPersistencePlugin({ storage, saveNow: true });

// @ts-expect-error flush API를 표현하지 않는다
stackPersistencePlugin({ storage, flush: () => {} });

// @ts-expect-error unload 차단 옵션을 표현하지 않는다
stackPersistencePlugin({ storage, blockUnload: true });

// @ts-expect-error 삭제 lifecycle 옵션을 표현하지 않는다
stackPersistencePlugin({ storage, delete: () => {} });

// @ts-expect-error TTL 옵션을 표현하지 않는다
stackPersistencePlugin({ storage, ttl: 60_000 });

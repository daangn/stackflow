/**
 * Contract: storage load recovery receives unknown error/context and returns
 * a typed record or null; core `onLoadError` receives `SnapshotLoadError` and
 * has the closed recover/propagate policy; save errors expose unknown detail
 * and `onSaveError` returns void.
 */
import type { SnapshotLoadError } from "@stackflow/core";
import type {
  StackPersistenceErrorHandlers,
  StackPersistencePluginOptions,
  StackSnapshotRecord,
  StackSnapshotStorage,
} from "@stackflow/plugin-stack-persistence";
import {
  type StackPersistenceSaveError,
  stackPersistencePlugin,
} from "@stackflow/plugin-stack-persistence";
import type { Equal, Expect } from "./helpers";

declare const saveError: StackPersistenceSaveError;
declare const storage: StackSnapshotStorage;
type Metadata = { version: number };
declare const metadataStorage: StackSnapshotStorage<Metadata>;
declare const fallbackRecord: StackSnapshotRecord<Metadata>;

// The expected save error class is assignable to Error.
export const saveAsError: Error = saveError;

// detail is unknown until narrowed.
export type SaveDetailIsUnknown = Expect<
  Equal<StackPersistenceSaveError["cause"]["detail"], unknown>
>;
export function readNarrowedDetail(error: StackPersistenceSaveError): number {
  const detail = error.cause.detail;
  return typeof detail === "number" ? detail : 0;
}

// Storage load recovery receives unknown values and may supply the same
// metadata record type. Core onLoadError has the closed recover/propagate
// policy. onSaveError returns void.
type StorageLoadHandler = NonNullable<
  StackPersistenceErrorHandlers<Metadata>["onStorageLoadError"]
>;
type LoadHandler = NonNullable<StackPersistenceErrorHandlers["onLoadError"]>;
type SaveHandler = NonNullable<StackPersistencePluginOptions["onSaveError"]>;
export type StorageLoadErrorIsUnknown = Expect<
  Equal<Parameters<StorageLoadHandler>[0]["error"], unknown>
>;
export type StorageLoadContextIsUnknown = Expect<
  Equal<Parameters<StorageLoadHandler>[0]["initialContext"], unknown>
>;
export type StorageLoadResultIsRecordOrNull = Expect<
  Equal<ReturnType<StorageLoadHandler>, StackSnapshotRecord<Metadata> | null>
>;
export type LoadHandlerErrorIsCoreError = Expect<
  Equal<Parameters<LoadHandler>[0]["error"], SnapshotLoadError>
>;
export type LoadContextIsUnknown = Expect<
  Equal<Parameters<LoadHandler>[0]["initialContext"], unknown>
>;
export type LoadPolicyIsClosed = Expect<
  Equal<ReturnType<LoadHandler>, { policy: "recover" | "propagate" }>
>;
export type SaveHandlerReturnsVoid = Expect<
  Equal<ReturnType<SaveHandler>, void>
>;

// Positive: all handlers and guarded unknown values.
stackPersistencePlugin({
  storage,
  onLoadError({ error, initialContext }) {
    if (
      typeof initialContext === "object" &&
      initialContext !== null &&
      "url" in initialContext
    ) {
      void initialContext.url;
    }
    const coreError: SnapshotLoadError = error;
    void coreError;
    return { policy: "recover" };
  },
  onSaveError({ error }) {
    const seen: StackPersistenceSaveError = error;
    void seen;
  },
});

stackPersistencePlugin({
  storage: metadataStorage,
  strategy: {
    createMetadata: () => ({ version: 2 }),
    shouldReuse: () => true,
  },
  onStorageLoadError({ error, initialContext }) {
    if (error instanceof Error) {
      void error.message;
    }
    if (typeof initialContext === "string") {
      void initialContext.length;
    }
    return fallbackRecord;
  },
});

// --- negative controls ---

export const invalidSaveCause: StackPersistenceSaveError["cause"] = {
  // @ts-expect-error save cause는 공개 단계 판별자를 제공하지 않는다
  kind: "storage",
  detail: null,
};

stackPersistencePlugin({
  storage,
  // @ts-expect-error storage load handler는 record 또는 null을 반환해야 한다
  onStorageLoadError: () => false,
});

stackPersistencePlugin({
  storage,
  onStorageLoadError({ error }) {
    // @ts-expect-error storage load error는 unknown — 좁히기 전 property 접근 금지
    void error.message;
    return null;
  },
});

stackPersistencePlugin({
  storage,
  // @ts-expect-error policy는 recover 또는 propagate만 허용된다
  onLoadError: () => ({ policy: "retry" }),
});

stackPersistencePlugin({
  storage,
  onLoadError({ error }) {
    // @ts-expect-error detail은 unknown — 좁히기 전 property 접근 금지
    void error.cause.detail.message;
    return { policy: "recover" };
  },
});

stackPersistencePlugin({
  storage,
  onLoadError({ initialContext }) {
    // @ts-expect-error initialContext는 unknown — 좁히기 전 property 접근 금지
    void initialContext.url;
    return { policy: "recover" };
  },
});

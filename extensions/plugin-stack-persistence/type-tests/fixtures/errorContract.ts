/**
 * Contract: the two error classes are `Error`s; load causes expose only
 * `detail`, while save causes are exactly `strategy | storage`; `detail` and
 * `initialContext` are `unknown` until narrowed; the `onLoadError` error is
 * the persistence/core union and its policy is exactly `recover | propagate`;
 * `onSaveError` returns void.
 */
import type { SnapshotLoadError } from "@stackflow/core";
import type {
  StackPersistencePluginOptions,
  StackSnapshotStorage,
} from "@stackflow/plugin-stack-persistence";
import {
  StackPersistenceLoadError,
  type StackPersistenceSaveError,
  stackPersistencePlugin,
} from "@stackflow/plugin-stack-persistence";
import type { Equal, Expect } from "./helpers";

declare const loadError: StackPersistenceLoadError;
declare const saveError: StackPersistenceSaveError;
declare const storage: StackSnapshotStorage;

// Both error classes are assignable to Error.
export const loadAsError: Error = loadError;
export const saveAsError: Error = saveError;

// Save causes are exhaustively strategy | storage.
export function categorizeSaveCause(error: StackPersistenceSaveError): string {
  switch (error.cause.kind) {
    case "strategy":
      return "strategy";
    case "storage":
      return "storage";
    default: {
      const impossible: never = error.cause;
      return impossible;
    }
  }
}

// detail is unknown until narrowed.
export type LoadDetailIsUnknown = Expect<
  Equal<StackPersistenceLoadError["cause"]["detail"], unknown>
>;
export type SaveDetailIsUnknown = Expect<
  Equal<StackPersistenceSaveError["cause"]["detail"], unknown>
>;
export function readNarrowedDetail(error: StackPersistenceSaveError): number {
  const detail = error.cause.detail;
  return typeof detail === "number" ? detail : 0;
}

// The onLoadError error is the persistence/core union, its context is
// unknown (narrowed by type guard before use), and the returned policy is
// exactly recover | propagate. onSaveError returns void.
type LoadHandler = NonNullable<StackPersistencePluginOptions["onLoadError"]>;
type SaveHandler = NonNullable<StackPersistencePluginOptions["onSaveError"]>;
export type LoadHandlerErrorIsUnion = Expect<
  Equal<
    Parameters<LoadHandler>[0]["error"],
    StackPersistenceLoadError | SnapshotLoadError
  >
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

// Positive: both handlers, instanceof narrowing, guarded context use.
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
    if (error instanceof StackPersistenceLoadError) {
      return { policy: "recover" };
    }
    const coreError: SnapshotLoadError = error;
    void coreError;
    return { policy: "propagate" };
  },
  onSaveError({ error }) {
    const seen: StackPersistenceSaveError = error;
    void seen;
  },
});

// --- negative controls ---

declare const networkCause: { kind: "network"; detail: unknown };

export const invalidLoadCause: StackPersistenceLoadError["cause"] = {
  // @ts-expect-error load cause는 공개 단계 판별자를 제공하지 않는다
  kind: "storage",
  detail: null,
};

// @ts-expect-error save cause는 strategy/storage 단계만 표현한다
export const invalidSaveCause: StackPersistenceSaveError["cause"] =
  networkCause;

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

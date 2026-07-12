/**
 * Contract: both strategy methods are synchronous; `initialContext` is
 * `unknown` until narrowed; the record is observe-only; `shouldReuse`
 * answers only the boolean reuse question — never a transformed snapshot
 * or a merge result.
 */
import type { StackSnapshot } from "@stackflow/core";
import type {
  StackSnapshotRecord,
  StackSnapshotStrategy,
} from "@stackflow/plugin-stack-persistence";

type Meta = { version: number };

// Positive: synchronous values, narrowing from unknown, readonly reads.
export const strategy: StackSnapshotStrategy<Meta> = {
  createMetadata({ snapshot, initialContext }) {
    const contextVersion =
      typeof initialContext === "number" ? initialContext : 0;
    return { version: contextVersion + snapshot.events.length };
  },
  shouldReuse({ record, initialContext }) {
    const observedVersion: number = record.metadata.version;
    const observedSnapshot: StackSnapshot = record.snapshot;
    if (typeof initialContext === "string") {
      return initialContext.length > 0 && observedVersion >= 0;
    }
    return observedSnapshot.events.length > 0;
  },
};

declare const args: {
  record: Readonly<StackSnapshotRecord<Meta>>;
  initialContext: unknown;
};
declare const someSnapshot: StackSnapshot;

// --- negative controls ---

export const asyncCreate: StackSnapshotStrategy<Meta> = {
  // @ts-expect-error createMetadata는 동기 계약이다 — Promise 반환 금지
  createMetadata: async () => ({ version: 1 }),
  shouldReuse: () => true,
};

export const asyncReuse: StackSnapshotStrategy<Meta> = {
  createMetadata: () => ({ version: 1 }),
  // @ts-expect-error shouldReuse는 동기 boolean 계약이다 — Promise 반환 금지
  shouldReuse: async () => true,
};

// @ts-expect-error initialContext는 unknown — 좁히기 전 property 접근 금지
export const beforeNarrowing = args.initialContext.url;

// @ts-expect-error record는 관찰 전용 — metadata에 대입할 수 없다
args.record.metadata = { version: 2 };

// @ts-expect-error record는 관찰 전용 — snapshot에 대입할 수 없다
args.record.snapshot = someSnapshot;

export const snapshotReturn: StackSnapshotStrategy<Meta> = {
  createMetadata: () => ({ version: 1 }),
  // @ts-expect-error 변환된 snapshot을 반환할 수 없다 — boolean만 허용
  shouldReuse: () => someSnapshot,
};

export const mergeReturn: StackSnapshotStrategy<Meta> = {
  createMetadata: () => ({ version: 1 }),
  // @ts-expect-error 병합 결과 record를 반환할 수 없다 — boolean만 허용
  shouldReuse: (input) => ({ ...input.record }),
};

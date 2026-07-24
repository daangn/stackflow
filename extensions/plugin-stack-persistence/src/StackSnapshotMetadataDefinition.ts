import type { Stack, StackSnapshot } from "@stackflow/core";

export type Result<Value> =
  | {
      ok: true;
      value: Value;
    }
  | {
      ok: false;
      detail?: unknown;
    };

export interface StackSnapshotMetadataDefinition<Metadata> {
  create(args: { stack: Stack; snapshot: StackSnapshot }): Metadata;
  parse(data: unknown): Result<Metadata>;
}

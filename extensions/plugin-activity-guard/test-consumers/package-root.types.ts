import type {
  ActivityGuard,
  GuardResolution,
} from "@stackflow/plugin-activity-guard";

declare const guard: ActivityGuard;
declare const resolution: GuardResolution;

void guard;
void resolution;

/**
 * Parses the harness app's URL query into a typed configuration. One harness
 * app instance is fully described by its query string, which keeps every
 * scenario a pure function of the URL the driver opened.
 */

import {
  type ActivityName,
  type BlockableAction,
  type ProbeMode,
  type ProbePlacement,
  queryKey,
  type RegistrationOrder,
} from "../shared/contract";

export interface ArmedActivity {
  activity: ActivityName;
  actions: Set<BlockableAction>;
}

export interface HarnessConfig {
  order: RegistrationOrder;
  useHash: boolean;
  lazyDelayMs: number;
  transitionDuration: number;
  /** Number of blocker instances (b1..bN) mounted on each armed activity. */
  blockerCount: number;
  blockAsync: boolean;
  armed: ArmedActivity[];
  probe: { placement: ProbePlacement; mode: ProbeMode } | null;
  /** When set, an armed blocker starts this nested navigation inside onBlocked. */
  onBlockedNav: "replace" | null;
}

const ALL_ACTIONS: BlockableAction[] = [
  "Pushed",
  "Popped",
  "Replaced",
  "StepPushed",
  "StepPopped",
  "StepReplaced",
];

function parseArmed(raw: string | null): ArmedActivity[] {
  if (!raw) {
    return [];
  }
  const armed: ArmedActivity[] = [];
  for (const group of raw.split(";")) {
    const [activity, actionList] = group.split(":");
    if (!activity) {
      continue;
    }
    const actions = new Set<BlockableAction>(
      (actionList ?? "")
        .split("+")
        .map((s) => s.trim())
        .filter((s): s is BlockableAction =>
          ALL_ACTIONS.includes(s as BlockableAction),
        ),
    );
    armed.push({ activity: activity as ActivityName, actions });
  }
  return armed;
}

/**
 * The effective knob source: a driver-injected global (kept out of the route
 * URL) when present, otherwise the URL query for manual/exploratory use.
 */
export function readHarnessSearch(): string {
  if (typeof window !== "undefined" && window.__HARNESS_KNOBS__) {
    return new URLSearchParams(window.__HARNESS_KNOBS__).toString();
  }
  return typeof window !== "undefined" ? window.location.search : "";
}

export function parseHarnessConfig(search: string): HarnessConfig {
  const q = new URLSearchParams(search);

  const order: RegistrationOrder =
    q.get(queryKey.order) === "blocker-first"
      ? "blocker-first"
      : "blocker-last";

  const probePlacementRaw = q.get(queryKey.probe);
  const probeModeRaw = q.get(queryKey.probeMode);
  const placement: ProbePlacement | null =
    probePlacementRaw === "before"
      ? "before"
      : probePlacementRaw === "after"
        ? "after"
        : null;
  const probe = placement
    ? { placement, mode: (probeModeRaw as ProbeMode) ?? "count" }
    : null;

  return {
    order,
    useHash: q.get(queryKey.hash) === "1",
    lazyDelayMs: Number(q.get(queryKey.lazyDelay) ?? "0") || 0,
    // Small but non-zero by default so the loading→idle settle is observable
    // without slowing long sequences; widen per-test via the query.
    transitionDuration: Number(q.get(queryKey.transitionDuration) ?? "30") || 0,
    blockerCount: q.get(queryKey.blockers) === "2" ? 2 : 1,
    blockAsync: q.get(queryKey.blockAsync) === "1",
    armed: parseArmed(q.get(queryKey.block)),
    probe,
    onBlockedNav: q.get(queryKey.onBlockedNav) === "replace" ? "replace" : null,
  };
}

/** The blocker ids mounted on a given activity, in order. */
export function blockerIdsFor(
  config: HarnessConfig,
  activity: ActivityName,
): string[] {
  if (!config.armed.some((a) => a.activity === activity)) {
    return [];
  }
  return Array.from({ length: config.blockerCount }, (_, i) => `b${i + 1}`);
}

/** The set of actions a given armed activity blocks. */
export function armedActionsFor(
  config: HarnessConfig,
  activity: ActivityName,
): Set<BlockableAction> {
  const entry = config.armed.find((a) => a.activity === activity);
  return entry ? entry.actions : new Set();
}

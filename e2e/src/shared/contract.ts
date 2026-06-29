/**
 * The observable contract between the harness app and its drivers.
 *
 * Everything a driver is allowed to read or actuate lives here: DOM test ids,
 * URL query knobs, and the shape of the `window.__harness__` instrumentation
 * bridge. Keeping it in one module means the app and every driver agree on the
 * contract by construction rather than by convention.
 *
 * The bridge deliberately exposes only public-API observations (the public
 * `getStack()` snapshot, `window.location`) and observations the harness itself
 * owns (its blocker's shouldBlock/onBlocked notifications, its probe co-plugin's
 * own hook calls, its error sink). It never exposes history-sync internals
 * (entry ordinals, suppression tokens, the sync queue, or history-sync's own
 * before/after hook calls).
 */

/** Activities the harness app registers. All support step navigation. */
export type ActivityName = "Home" | "Article" | "Third" | "Fourth" | "Lazy";

/** Navigation actions a blocker can be armed against. */
export type BlockableAction =
  | "Pushed"
  | "Popped"
  | "Replaced"
  | "StepPushed"
  | "StepPopped"
  | "StepReplaced";

/** A stable identifier for one armed blocker instance (e.g. "b1", "b2"). */
export type BlockerId = string;

/** DOM markers each rendered screen exposes. */
export const testid = {
  screen: (activity: ActivityName) => `screen-${activity}`,
  /** Serialized params of the active activity (JSON). */
  activityParams: "activity-params",
  /** Current step index of the active activity. */
  stepIndex: "step-index",
  /** Transition state of the active activity. */
  transitionState: "transition-state",

  /** Visible "currently blocking" indicator for a blocker. */
  blocking: (id: BlockerId) => `blocking-${id}`,
  /** Per-blocker confirmation dialog raised by onBlocked. */
  blockDialog: (id: BlockerId) => `block-dialog-${id}`,
  /** Calls the captured proceed() for that blocker. */
  blockConfirm: (id: BlockerId) => `block-confirm-${id}`,
  /** Discards the dialog, leaving the navigation blocked. */
  blockCancel: (id: BlockerId) => `block-cancel-${id}`,
  /** Toggles mount/unmount of a blocker-owning component (lifecycle cases). */
  blockerMountToggle: (id: BlockerId) => `blocker-mount-toggle-${id}`,
  /** Toggles whether a mounted blocker is armed (re-renders shouldBlock). */
  blockerArmToggle: (id: BlockerId) => `blocker-arm-toggle-${id}`,

  /** Primary id field read by push/replace/step controls. */
  paramId: "param-id",
  /** Title field read by Article push/replace controls. */
  paramTitle: "param-title",

  pushArticle: "push-article",
  pushThird: "push-third",
  pushFourth: "push-fourth",
  pushLazy: "push-lazy",
  replaceArticle: "replace-article",
  replaceThird: "replace-third",
  replaceFourth: "replace-fourth",
  pop: "pop",
  stepPush: "step-push",
  stepPop: "step-pop",
  stepReplace: "step-replace",
} as const;

/** URL query knobs that configure one harness app instance. */
export const queryKey = {
  /** "blocker-first" | "blocker-last" (default) — plugin registration order. */
  order: "order",
  /** "1" → historySyncPlugin useHash:true. */
  hash: "hash",
  /** Milliseconds the Lazy activity withholds its content (race window width). */
  lazyDelay: "lazyDelay",
  /**
   * Which activities arm a blocker and against which actions, e.g.
   * `Article:Popped` or `Home:Pushed` or `Article:Pushed+Popped`.
   * Multiple activities separated by ";".
   */
  block: "block",
  /** "2" → arm two blocker instances (b1,b2) per armed activity. */
  blockers: "blockers",
  /** "1" → proceed() is invoked across an async gap (deferred confirm). */
  blockAsync: "blockAsync",
  /** "before" | "after" — register the probe co-plugin before/after blocker. */
  probe: "probe",
  /** "count" | "nested" | "prevent" — probe behavior on replay. */
  probeMode: "probeMode",
  /** "replace" — the armed blocker starts a nested navigation inside onBlocked. */
  onBlockedNav: "onBlockedNav",
  /** Milliseconds for the activity enter/exit transition (default small). */
  transitionDuration: "transitionDuration",
} as const;

export type RegistrationOrder = "blocker-first" | "blocker-last";
export type ProbePlacement = "before" | "after";
export type ProbeMode = "count" | "nested" | "prevent";

export interface BlockerLogEntry {
  blockerId: BlockerId;
  action: BlockableAction;
  phase: "shouldBlock" | "blocked" | "proceed";
  /** Set when the blocker's onBlocked threw (observed via the error sink). */
  threw?: boolean;
}

export interface ProbeLogEntry {
  /** The probe's own before-hook that fired, e.g. "onBeforePush". */
  hook: string;
  /** Monotonic call index for that hook (1 = first attempt, 2 = replay). */
  count: number;
}

/** A serialized, internals-free view of one activity. */
export interface StackActivityView {
  name: string;
  params: Record<string, string | undefined>;
  transitionState: string;
  isActive: boolean;
  stepCount: number;
  stepParams: Record<string, string | undefined>;
}

/** A serialized, internals-free view of the public stack snapshot. */
export interface StackView {
  globalTransitionState: "idle" | "loading" | "paused";
  activities: StackActivityView[];
  /** The active (visible) activity, or null. */
  active: StackActivityView | null;
}

export interface LocationView {
  href: string;
  pathname: string;
  search: string;
  hash: string;
}

/** The instrumentation bridge installed at `window.__harness__`. */
export interface HarnessBridge {
  /** True once the initial route has settled. */
  ready: boolean;
  getStack(): StackView;
  getLocation(): LocationView;
  /** Times the historySync fallbackActivity callback ran (initial routing). */
  getFallbackCallCount(): number;
  getBlockerLog(): BlockerLogEntry[];
  getProbeLog(): ProbeLogEntry[];
  /** Errors delivered to the blocker plugin's onError sink. */
  getErrors(): string[];
}

declare global {
  interface Window {
    __harness__?: HarnessBridge;
    /**
     * Configuration knobs injected by the driver before the app loads, kept
     * out of the route URL so navigation assertions see clean paths. Falls back
     * to the URL query when absent (for manual / exploratory use).
     */
    __HARNESS_KNOBS__?: Record<string, string>;
  }
}

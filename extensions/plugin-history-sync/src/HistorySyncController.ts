import type { Activity, ActivityStep, Stack } from "@stackflow/core";
import { Action, type History } from "history";
import {
  parseState,
  pushState,
  readBrowserOrdinal,
  replaceState,
} from "./historyState";

/**
 * The actions this controller drives. Backward/forward user navigations are
 * translated into these pipeline calls (so other plugins' `onBefore*` run and a
 * `preventDefault` is respected); the controller itself never dispatches events
 * directly past the hooks.
 */
export interface ControllerActions {
  getStack: () => Stack;
  push: (params: {
    activityId: string;
    activityName: string;
    activityParams: { [key: string]: string | undefined };
  }) => void;
  stepPush: (params: {
    stepId: string;
    stepParams: { [key: string]: string | undefined };
  }) => void;
  pop: () => void;
  stepPop: () => void;
}

export interface HistorySyncControllerOptions {
  history: History;
  useHash?: boolean;
  actions: ControllerActions;
  /** Builds the URL pathname an activity/step occupies, from the route template. */
  makePath: (
    activityName: string,
    params: { [key: string]: string | undefined },
  ) => string;
}

/** One browser entry's worth of the committed stack, bottom-to-top. */
interface CommittedEntry {
  activity: Activity;
  step: ActivityStep;
  isBase: boolean;
}

function isEntered(activity: Activity): boolean {
  return (
    activity.transitionState === "enter-active" ||
    activity.transitionState === "enter-done"
  );
}

/**
 * The linear sequence of browser entries the committed stack should occupy,
 * bottom-to-top. One entry per step; the first step of an activity is its base
 * entry. Order comes from the public `zIndex` stacking coordinate, never from
 * the core activity id ordering.
 */
function committedEntries(stack: Stack): CommittedEntry[] {
  const entered = stack.activities
    .filter(isEntered)
    .sort((a, b) => a.zIndex - b.zIndex);

  const entries: CommittedEntry[] = [];
  for (const activity of entered) {
    activity.steps.forEach((step, index) => {
      entries.push({ activity, step, isBase: index === 0 });
    });
  }
  return entries;
}

function activeActivity(stack: Stack): Activity | undefined {
  return stack.activities.find((activity) => activity.isActive);
}

/**
 * The identity an entry stands for: a step's id, which for an activity's base
 * step equals the activity id. Used only for equality matching (am I looking at
 * the same screen?), never for ordering.
 */
function entryIdentity(entry: CommittedEntry): string {
  return entry.step.id;
}

function stateIdentity(state: {
  activity: Activity;
  step?: ActivityStep;
}): string {
  return state.step?.id ?? state.activity.id;
}

/**
 * The single authority that mutates the browser history. It anchors every
 * browser change to the *committed* stack (post-effect), reacting to commit
 * notifications and to user popstates:
 *
 * - A committed stack change schedules a sync pass.
 * - A user popstate is translated into the corresponding pipeline action and
 *   then schedules a sync pass — it never touches the browser directly.
 *
 * The sync pass is a pure, idempotent function of `(committed stack, current
 * entry)`: it compares the stack ordinal to the browser ordinal and pushes,
 * steps back, replaces, or does nothing. It runs only at idle (so buffered and
 * delayed async commits are absorbed) and coalesces repeated reservations into
 * one. A single in-flight suppression token keeps the self-induced backward move
 * — the one operation that produces its own popstate — from being mistaken for a
 * user navigation; no token is taken for a move that does not happen.
 */
export class HistorySyncController {
  private readonly history: History;
  private readonly useHash?: boolean;
  private readonly actions: ControllerActions;
  private readonly makePath: HistorySyncControllerOptions["makePath"];

  /** Set while a self-induced backward move awaits its own popstate. */
  private inFlight = false;
  /** This controller's belief of the browser's current ordinal. */
  private browserCursor = 0;
  private unlisten: (() => void) | null = null;

  constructor(options: HistorySyncControllerOptions) {
    this.history = options.history;
    this.useHash = options.useHash;
    this.actions = options.actions;
    this.makePath = options.makePath;
  }

  /**
   * Stamp the initial committed stack onto the browser entries (the starting
   * invariant is browser == stack at entry), then start following user
   * navigation. Skips re-stamping when the entry already carries plugin state
   * (a reload — out of scope), only adopting its ordinal.
   */
  start(): void {
    const existing = parseState(this.history.location.state);

    if (existing === null) {
      const entries = committedEntries(this.actions.getStack());
      entries.forEach((entry, ordinal) => {
        if (ordinal === 0) {
          this.stampReplace(entry, 0);
        } else {
          this.stampPush(entry, ordinal);
        }
      });
      this.browserCursor = entries.length > 0 ? entries.length - 1 : 0;
    } else {
      this.browserCursor =
        typeof existing.ordinal === "number" ? existing.ordinal : 0;
    }

    this.unlisten = this.history.listen((update) =>
      this.onHistoryUpdate(update),
    );
  }

  dispose(): void {
    this.unlisten?.();
    this.unlisten = null;
  }

  /**
   * Reserve a sync pass in reaction to a committed stack change. The pass itself
   * is idle-gated and idempotent, so reservations made while transitioning
   * naturally coalesce into the single pass that runs once the stack settles.
   */
  scheduleSync(): void {
    this.syncPass();
  }

  // --- the sync pass: the only browser mutation authority ---

  private syncPass(): void {
    if (this.inFlight) {
      return;
    }

    const stack = this.actions.getStack();
    if (stack.globalTransitionState !== "idle") {
      return;
    }

    const entries = committedEntries(stack);
    if (entries.length === 0) {
      return;
    }

    const browserOrdinal = readBrowserOrdinal(this.history);
    if (browserOrdinal === null) {
      return;
    }

    const stackOrdinal = entries.length - 1;
    const delta = stackOrdinal - browserOrdinal;

    if (delta > 0) {
      for (
        let ordinal = browserOrdinal + 1;
        ordinal <= stackOrdinal;
        ordinal += 1
      ) {
        this.stampPush(entries[ordinal], ordinal);
      }
      this.browserCursor = stackOrdinal;
    } else if (delta < 0) {
      this.inFlight = true;
      this.browserCursor = stackOrdinal;
      this.history.go(delta);
    } else {
      const browserState = parseState(this.history.location.state);
      const top = entries[stackOrdinal];
      if (!browserState || stateIdentity(browserState) !== entryIdentity(top)) {
        this.stampReplace(top, stackOrdinal);
      }
      this.browserCursor = stackOrdinal;
    }
  }

  // --- following user navigation ---

  private onHistoryUpdate(update: {
    action: Action;
    location: History["location"];
  }): void {
    // Push/Replace are this plugin's own synchronous, sole-author mutations.
    if (update.action !== Action.Pop) {
      return;
    }

    // A POP while a self-induced backward move is in flight is suppressed: it is
    // that move's own callback, or a user navigation that lands in the same
    // window and is dropped (the following sync pass realigns the browser).
    if (this.inFlight) {
      this.inFlight = false;
      const landed = readBrowserOrdinal(this.history);
      if (landed !== null) {
        this.browserCursor = landed;
      }
      this.scheduleSync();
      return;
    }

    const targetState = parseState(update.location.state);
    if (!targetState || typeof targetState.ordinal !== "number") {
      // Navigated to an entry this plugin did not stamp (e.g. below the bottom
      // app entry); there is nothing to translate.
      return;
    }

    const to = targetState.ordinal;
    const movement = to - this.browserCursor;
    this.browserCursor = to;

    if (movement < 0) {
      this.translateBackward(-movement);
    } else if (movement > 0) {
      this.translateForward(targetState);
    }

    // Always reserve a sync pass: even if the attempt is prevented (no commit,
    // no change notification), the reserved pass restores the browser to the
    // committed stack.
    this.scheduleSync();
  }

  private translateBackward(levels: number): void {
    for (let i = 0; i < levels; i += 1) {
      const before = committedEntries(this.actions.getStack()).length;
      const active = activeActivity(this.actions.getStack());
      if (!active) {
        break;
      }

      if (active.steps.length > 1) {
        this.actions.stepPop();
      } else {
        this.actions.pop();
      }

      const after = committedEntries(this.actions.getStack()).length;
      if (after === before) {
        // The attempt did not commit (prevented, or nothing left to peel).
        break;
      }
    }
  }

  private translateForward(targetState: {
    activity: Activity;
    step?: ActivityStep;
  }): void {
    const active = activeActivity(this.actions.getStack());

    if (targetState.step && active && targetState.activity.id === active.id) {
      this.actions.stepPush({
        stepId: targetState.step.id,
        stepParams: targetState.step.params,
      });
    } else {
      this.actions.push({
        activityId: targetState.activity.id,
        activityName: targetState.activity.name,
        activityParams: targetState.activity.params,
      });
    }
  }

  // --- self-induced entry stamping ---

  private stampPush(entry: CommittedEntry, ordinal: number): void {
    pushState({
      history: this.history,
      pathname: this.makePath(entry.activity.name, entry.step.params),
      state: {
        activity: entry.activity,
        step: entry.isBase ? undefined : entry.step,
        ordinal,
      },
      useHash: this.useHash,
    });
  }

  private stampReplace(entry: CommittedEntry, ordinal: number): void {
    replaceState({
      history: this.history,
      pathname: this.makePath(entry.activity.name, entry.step.params),
      state: {
        activity: entry.activity,
        step: entry.isBase ? undefined : entry.step,
        ordinal,
      },
      useHash: this.useHash,
    });
  }
}

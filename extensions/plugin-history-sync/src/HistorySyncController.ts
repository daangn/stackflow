import type { Activity, ActivityStep, Stack } from "@stackflow/core";
import { Action, type History } from "history";
import {
  parseState,
  pushState,
  readBrowserOrdinal,
  replaceState,
} from "./historyState";

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
  makePath: (
    activityName: string,
    params: { [key: string]: string | undefined },
  ) => string;
}

interface CommittedEntry {
  activity: Activity;
  step: ActivityStep;
  isBase: boolean;
}

function isEntered(activity: Activity): boolean {
  return activity.transitionState === "enter-done";
}

/**
 * The linear sequence of browser entries the committed stack should occupy,
 * bottom-to-top. One entry per step; the first step of an activity is its base
 * entry. The bottom-to-top order is by `enteredBy.eventDate` (a later entry sits
 * higher), matching the core's own ordering; direction and distance come from
 * the entry ordinal, never from comparing core activity ids.
 */
function committedEntries(stack: Stack): CommittedEntry[] {
  const entered = stack.activities
    .filter(isEntered)
    .sort((a, b) => a.enteredBy.eventDate - b.enteredBy.eventDate);

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

export class HistorySyncController {
  private readonly history: History;
  private readonly useHash?: boolean;
  private readonly actions: ControllerActions;
  private readonly makePath: HistorySyncControllerOptions["makePath"];

  /** Set while a self-induced backward move awaits its own popstate. */
  private inFlight = false;
  /**
   * A reserved sync pass kept (not consumed) while a self-induced move is in
   * flight or the stack is mid-transition, so a reservation made during an
   * in-flight move is flushed afterward rather than lost.
   */
  private pendingSync = false;
  /** This controller's belief of the browser's current ordinal. */
  private browserCursor = 0;
  private unlisten: (() => void) | null = null;

  constructor(options: HistorySyncControllerOptions) {
    this.history = options.history;
    this.useHash = options.useHash;
    this.actions = options.actions;
    this.makePath = options.makePath;
  }

  start(): void {
    if (this.unlisten) {
      throw new Error("HistorySyncController.start() called twice");
    }

    const existing = parseState(this.history.location.state);
    const entries = committedEntries(this.actions.getStack());

    if (existing === null) {
      entries.forEach((entry, ordinal) => {
        if (ordinal === 0) {
          this.stampReplace(entry, 0);
        } else {
          this.stampPush(entry, ordinal);
        }
      });
      this.browserCursor = entries.length > 0 ? entries.length - 1 : 0;
    } else if (existing.ordinal === entries.length - 1) {
      this.browserCursor = existing.ordinal;
    } else {
      throw new Error('History state unmatched');
    }

    this.unlisten = this.history.listen((update) =>
      this.onHistoryUpdate(update),
    );
  }

  scheduleSync(): void {
    this.pendingSync = true;
    this.flushSync();
  }

  private flushSync(): void {
    if (this.inFlight || !this.pendingSync) {
      return;
    }

    const stack = this.actions.getStack();
    if (stack.globalTransitionState !== "idle") {
      return;
    }

    this.pendingSync = false;
    this.syncPass(stack);
  }

  // --- the sync pass: the only browser mutation authority ---

  private syncPass(stack: Stack): void {
    const entries = committedEntries(stack);
    if (entries.length === 0) {
      throw new Error(
        "At least one active activity was expected but empty stack is found",
      );
    }

    const browserState = parseState(this.history.location.state);
    if (!browserState) {
      throw new Error("invariant: current browser entry has no ordinal");
    }
    const browserOrdinal = browserState.ordinal;

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
      const top = entries[stackOrdinal];
      if (stateIdentity(browserState) !== entryIdentity(top)) {
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
    if (update.action !== Action.Pop) {
      return;
    }

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
    if (!targetState) {
      throw new Error(
        "invariant: received a popstate for an entry not stamped by this plugin",
      );
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

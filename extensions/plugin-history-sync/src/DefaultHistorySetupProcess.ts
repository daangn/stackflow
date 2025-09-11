import type { HistoryEntry } from "RouteLike";
import {
  id,
  makeEvent,
  type PushedEvent,
  type StackflowActions,
} from "@stackflow/core";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

export const DEFAULT_HISTORY_SETUP_PROCESS_STATUS = {
  PROGRESS: "progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type DefaultHistorySetupProcessStatus =
  (typeof DEFAULT_HISTORY_SETUP_PROCESS_STATUS)[keyof typeof DEFAULT_HISTORY_SETUP_PROCESS_STATUS];

export interface DefaultHistorySetupProcessSnapshot {
  status: DefaultHistorySetupProcessStatus;
  defaultHistoryEntryEntities: Set<string>;
}

export class DefaultHistorySetupProcess {
  private defaultHistoryEntryEntities: Set<string>;
  private pendingEntryInsertionTasks: ((actions: StackflowActions) => void)[];
  private entryPath: string;
  private status: DefaultHistorySetupProcessStatus;
  private processListeners: (() => void)[];
  private navigateToTargetActivity: (actions: StackflowActions) => void;
  initialEvents: PushedEvent[];

  constructor(
    defaultHistory: [HistoryEntry, ...HistoryEntry[]],
    entryPath: string,
    navigateToTargetActivity: (actions: StackflowActions) => void,
  ) {
    const initialHistoryEntry = defaultHistory[0];
    const initialActivityId = id();

    this.entryPath = entryPath;
    this.initialEvents = [
      makeEvent("Pushed", {
        activityId: initialActivityId,
        activityName: initialHistoryEntry.activityName,
        activityParams: {
          ...initialHistoryEntry.activityParams,
        },
        eventDate: Date.now() - MINUTE,
        activityContext: {
          path: this.entryPath,
          lazyActivityComponentRenderContext: {
            shouldRenderImmediately: true,
          },
        },
      }),
    ];
    this.defaultHistoryEntryEntities = new Set([initialActivityId]);
    this.pendingEntryInsertionTasks = [
      ...(initialHistoryEntry.additionalSteps?.length
        ? [
            (actions: StackflowActions) => {
              for (const {
                stepParams,
                hasZIndex,
              } of initialHistoryEntry.additionalSteps!) {
                const stepId = id();

                this.defaultHistoryEntryEntities.add(stepId);

                actions.stepPush({
                  stepId,
                  stepParams,
                  hasZIndex,
                });
              }
            },
          ]
        : []),
      ...defaultHistory
        .slice(1)
        .map(
          ({ activityName, activityParams, additionalSteps }) =>
            ({ push, stepPush }: StackflowActions) => {
              const activityId = id();

              this.defaultHistoryEntryEntities.add(activityId);

              push({
                activityId,
                activityName,
                activityParams,
                activityContext: {
                  path: this.entryPath,
                  lazyActivityComponentRenderContext: {
                    shouldRenderImmediately: true,
                  },
                },
              });

              for (const { stepParams, hasZIndex } of additionalSteps ?? []) {
                const stepId = id();

                this.defaultHistoryEntryEntities.add(stepId);

                stepPush({
                  stepId,
                  stepParams,
                  hasZIndex,
                });
              }
            },
        ),
    ];
    this.processListeners = [];
    this.navigateToTargetActivity = navigateToTargetActivity;
    this.status = DEFAULT_HISTORY_SETUP_PROCESS_STATUS.PROGRESS;
  }

  captureNavigationOpportunity(actions: StackflowActions): void {
    if (
      this.status === DEFAULT_HISTORY_SETUP_PROCESS_STATUS.COMPLETED ||
      this.status === DEFAULT_HISTORY_SETUP_PROCESS_STATUS.CANCELLED
    )
      return;

    const stack = actions.getStack();

    if (stack.globalTransitionState !== "idle") return;
    if (
      stack.activities.some(
        ({ id, enteredBy, exitedBy, steps }) =>
          !this.defaultHistoryEntryEntities.has(id) ||
          enteredBy.name === "Replaced" ||
          exitedBy ||
          steps.some(
            ({ id, enteredBy, exitedBy }) =>
              !this.defaultHistoryEntryEntities.has(id) ||
              enteredBy.name === "StepReplaced" ||
              enteredBy.name === "Replaced" ||
              exitedBy,
          ),
      )
    ) {
      this.status = DEFAULT_HISTORY_SETUP_PROCESS_STATUS.CANCELLED;
      this.notifyProcessListeners();

      return;
    }

    const nextTask = this.pendingEntryInsertionTasks.shift();

    if (nextTask) {
      nextTask(actions);
    } else {
      this.status = DEFAULT_HISTORY_SETUP_PROCESS_STATUS.COMPLETED;
      this.navigateToTargetActivity(actions);
    }

    this.notifyProcessListeners();
  }

  getSnapshot(): DefaultHistorySetupProcessSnapshot {
    return {
      status: this.status,
      defaultHistoryEntryEntities: new Set(this.defaultHistoryEntryEntities),
    };
  }

  subscribe(listener: () => void): () => void {
    this.processListeners.push(listener);

    return () => {
      this.processListeners = this.processListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  private notifyProcessListeners(): void {
    this.processListeners.forEach((listener) => listener());
  }
}

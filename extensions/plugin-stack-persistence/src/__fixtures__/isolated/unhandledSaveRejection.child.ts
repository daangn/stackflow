/**
 * Scenario: a save promise rejects and no `onSaveError` handler was given.
 * The contract is that the save error surfaces at the asynchronous
 * unhandled-error boundary — not swallowed, not replaced by console.error —
 * while synchronous navigation calls never throw because of it.
 */
import { makeCoreStore } from "@stackflow/core";
import {
  StackPersistenceSaveError,
  stackPersistencePlugin,
} from "@stackflow/plugin-stack-persistence";
import { ARTICLE_ACTIVITY, freshEvents } from "../stackFixtures";
import {
  type CapturedAsyncError,
  describeAsyncError,
  printReport,
  waitUntil,
  yieldTurns,
} from "./childReport";

const SAVE_REJECTION_SENTINEL = "save-rejection-sentinel";

async function main() {
  let consoleErrorCallCount = 0;
  console.error = () => {
    consoleErrorCallCount += 1;
  };

  const unhandledRejections: CapturedAsyncError[] = [];
  process.on("unhandledRejection", (reason) => {
    unhandledRejections.push(
      describeAsyncError(reason, StackPersistenceSaveError),
    );
  });

  const uncaughtExceptions: string[] = [];
  process.on("uncaughtException", (error) => {
    uncaughtExceptions.push(String(error));
  });

  let saveCallCount = 0;
  const storage = {
    load: () => null,
    save() {
      saveCallCount += 1;
      return Promise.reject(SAVE_REJECTION_SENTINEL);
    },
  };

  const store = makeCoreStore({
    initialEvents: freshEvents(),
    plugins: [stackPersistencePlugin({ storage })],
  });

  store.init();

  await waitUntil(() => saveCallCount >= 1, "the initial idle save request");
  await yieldTurns(20);

  let navigationThrewSynchronously = false;
  try {
    store.actions.push({
      activityId: "child-article-1",
      activityName: ARTICLE_ACTIVITY,
      activityParams: {},
    });
  } catch {
    navigationThrewSynchronously = true;
  }

  await yieldTurns(20);

  printReport({
    sentinel: SAVE_REJECTION_SENTINEL,
    saveCallCount,
    unhandledRejections,
    uncaughtExceptions,
    consoleErrorCallCount,
    navigationThrewSynchronously,
  });

  process.exit(0);
}

main().catch((error) => {
  printReport({ childSetupFailed: String(error) });
  process.exit(1);
});

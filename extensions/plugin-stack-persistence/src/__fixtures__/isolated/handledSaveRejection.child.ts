/**
 * Scenario: a save promise rejects and an `onSaveError` handler is given.
 * The contract is that the callback takes over the handling: it is called
 * once per failure, and nothing reaches the unhandled-error boundary, no
 * extra throw happens, and nothing is written to console.error.
 */
import { makeCoreStore } from "@stackflow/core";
import {
  StackPersistenceSaveError,
  stackPersistencePlugin,
} from "@stackflow/plugin-stack-persistence";
import { freshEvents } from "../stackFixtures";
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

  const onSaveErrorCalls: CapturedAsyncError[] = [];
  const store = makeCoreStore({
    initialEvents: freshEvents(),
    plugins: [
      stackPersistencePlugin({
        storage,
        onSaveError({ error }) {
          onSaveErrorCalls.push(
            describeAsyncError(error, StackPersistenceSaveError),
          );
        },
      }),
    ],
  });

  store.init();

  await waitUntil(() => saveCallCount >= 1, "the initial idle save request");
  await waitUntil(
    () => onSaveErrorCalls.length >= 1,
    "the onSaveError callback",
  );
  await yieldTurns(20);

  printReport({
    sentinel: SAVE_REJECTION_SENTINEL,
    saveCallCount,
    onSaveErrorCalls,
    unhandledRejections,
    uncaughtExceptions,
    consoleErrorCallCount,
  });

  process.exit(0);
}

main().catch((error) => {
  printReport({ childSetupFailed: String(error) });
  process.exit(1);
});

/**
 * Scenario: createMetadata throws during initial persistence and a synchronous
 * step navigation. The original value must reach one asynchronous error
 * boundary without entering onSaveError or unwinding either caller.
 */
import { makeCoreStore } from "@stackflow/core";
import {
  StackPersistenceSaveError,
  stackPersistencePlugin,
} from "@stackflow/plugin-stack-persistence";
import { freshEvents, makeRecord, richSnapshot } from "../stackFixtures";
import { printReport, waitUntil } from "./childReport";

const sentinel = new Error("metadata-creation-sentinel");

async function main() {
  let consoleErrorCallCount = 0;
  console.error = () => {
    consoleErrorCallCount += 1;
  };

  const unhandledRejections: Array<{
    isSentinel: boolean;
    isError: boolean;
    isStackPersistenceSaveError: boolean;
  }> = [];
  process.on("unhandledRejection", (reason) => {
    unhandledRejections.push({
      isSentinel: reason === sentinel,
      isError: reason instanceof Error,
      isStackPersistenceSaveError: reason instanceof StackPersistenceSaveError,
    });
  });

  const uncaughtExceptions: string[] = [];
  process.on("uncaughtException", (error) => {
    uncaughtExceptions.push(String(error));
  });

  const previousRecord = makeRecord(richSnapshot(), { origin: "m-prev" });
  let completedRecord = previousRecord;
  let saveCallCount = 0;
  const storage = {
    load: () => previousRecord,
    save(record: typeof previousRecord) {
      saveCallCount += 1;
      completedRecord = record;
      return Promise.resolve();
    },
  };

  let createMetadataCallCount = 0;
  let onSaveErrorCallCount = 0;
  const store = makeCoreStore({
    initialEvents: freshEvents(),
    plugins: [
      stackPersistencePlugin<{ origin: string }>({
        storage,
        strategy: {
          createMetadata() {
            createMetadataCallCount += 1;
            throw sentinel;
          },
          shouldReuse: () => true,
        },
        onSaveError() {
          onSaveErrorCallCount += 1;
        },
      }),
    ],
  });

  let initThrewSynchronously = false;
  try {
    store.init();
  } catch {
    initThrewSynchronously = true;
  }
  await waitUntil(
    () => unhandledRejections.length >= 1,
    "the initial metadata error",
  );

  let navigationThrewSynchronously = false;
  try {
    store.actions.stepPush({
      stepId: "metadata-error-step",
      stepParams: { source: "child" },
    });
  } catch {
    navigationThrewSynchronously = true;
  }
  await waitUntil(
    () => unhandledRejections.length >= 2,
    "the step navigation metadata error",
  );

  const stepIds = store.actions
    .getStack()
    .activities.flatMap((activity) => activity.steps.map((step) => step.id));

  printReport({
    unhandledRejections,
    uncaughtExceptions,
    consoleErrorCallCount,
    onSaveErrorCallCount,
    saveCallCount,
    createMetadataCallCount,
    completedRecordIsPrevious: completedRecord === previousRecord,
    initThrewSynchronously,
    navigationThrewSynchronously,
    stepIds,
  });

  process.exit(0);
}

main().catch((error) => {
  printReport({ childSetupFailed: String(error) });
  process.exit(1);
});

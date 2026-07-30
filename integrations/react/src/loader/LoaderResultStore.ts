import {
  defer,
  type SyncInspectablePromise,
} from "../utils/SyncInspectablePromise";

const LOADER_RESULT_ID_KEY = "@stackflow/react/loaderResultId";

export type LoaderResultId = string;

type LoaderResultEntry = {
  promise: SyncInspectablePromise<unknown>;
  start?: (load: () => unknown) => boolean;
};

let nextLoaderResultId = 0;

export class LoaderResultStore {
  private readonly entries = new Map<LoaderResultId, LoaderResultEntry>();

  add(promise: SyncInspectablePromise<unknown>): LoaderResultId {
    const loaderResultId = makeLoaderResultId();
    this.entries.set(loaderResultId, { promise });
    return loaderResultId;
  }

  addDeferred(): LoaderResultId {
    const loaderData = defer<unknown>();
    let started = false;
    const loaderResultId = makeLoaderResultId();

    this.entries.set(loaderResultId, {
      promise: loaderData.promise,
      start(load) {
        if (started) {
          return false;
        }

        started = true;

        try {
          loaderData.resolve(load());
        } catch (error) {
          loaderData.reject(error);
        }

        return true;
      },
    });

    return loaderResultId;
  }

  get(loaderResultId: LoaderResultId | undefined) {
    return loaderResultId
      ? this.entries.get(loaderResultId)?.promise
      : undefined;
  }

  start(loaderResultId: LoaderResultId, load: () => unknown) {
    const entry = this.entries.get(loaderResultId);

    if (!entry?.start || !entry.start(load)) {
      return undefined;
    }

    return entry.promise;
  }

  getId(activityContext: unknown): LoaderResultId | undefined {
    if (typeof activityContext !== "object" || activityContext === null) {
      return undefined;
    }

    const loaderResultId = (activityContext as Record<string, unknown>)[
      LOADER_RESULT_ID_KEY
    ];

    return typeof loaderResultId === "string" ? loaderResultId : undefined;
  }

  withId(activityContext: unknown, loaderResultId: LoaderResultId) {
    return {
      ...(typeof activityContext === "object" && activityContext !== null
        ? activityContext
        : {}),
      [LOADER_RESULT_ID_KEY]: loaderResultId,
    };
  }
}

function makeLoaderResultId(): LoaderResultId {
  nextLoaderResultId += 1;
  return nextLoaderResultId.toString();
}

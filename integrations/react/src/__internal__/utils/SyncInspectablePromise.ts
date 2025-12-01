export const PromiseStatus = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
} as const;

export type PromiseStatus = (typeof PromiseStatus)[keyof typeof PromiseStatus];

export class SyncInspectablePromise<T> extends Promise<T> {
  private state:
    | {
        status: typeof PromiseStatus.PENDING;
      }
    | {
        status: typeof PromiseStatus.FULFILLED;
        value: T;
      }
    | {
        status: typeof PromiseStatus.REJECTED;
        reason: unknown;
      } = {
    status: PromiseStatus.PENDING,
  };

  constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: unknown) => void,
    ) => void,
  ) {
    let _resolve!: (value: T | PromiseLike<T>) => void;
    let _reject!: (reason?: unknown) => void;

    super((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });

    const { resolve, reject } = this.createResolvingFunctions(
      (value) => {
        _resolve(value);
        this.state = {
          status: PromiseStatus.FULFILLED,
          value: value,
        };
      },
      (reason) => {
        _reject(reason);
        this.state = {
          status: PromiseStatus.REJECTED,
          reason: reason,
        };
      },
    );

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  private createResolvingFunctions(
    fulfillPromise: (value: T) => void,
    rejectPromise: (reason?: unknown) => void,
  ): {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  } {
    let alreadyResolved = false;

    return {
      resolve: (value) => {
        if (alreadyResolved) return;

        alreadyResolved = true;

        if (value === this) {
          rejectPromise(new TypeError("Cannot resolve a promise with itself"));

          return;
        }

        try {
          const thenAction =
            typeof value === "object" && value !== null && "then" in value
              ? value.then
              : null;

          if (typeof thenAction === "function") {
            Promise.resolve().finally(() => {
              const { resolve, reject } = this.createResolvingFunctions(
                fulfillPromise,
                rejectPromise,
              );

              try {
                thenAction.call(value, resolve, reject);
              } catch (error) {
                reject(error);
              }
            });

            return;
          } else {
            fulfillPromise(value as T);

            return;
          }
        } catch (error) {
          rejectPromise(error);

          return;
        }
      },
      reject: (reason) => {
        if (alreadyResolved) return;

        alreadyResolved = true;
        rejectPromise(reason);
      },
    };
  }

  get status(): PromiseStatus {
    return this.state.status;
  }

  get value(): T | undefined {
    if (this.state.status === PromiseStatus.FULFILLED) return this.state.value;

    return undefined;
  }

  get reason(): unknown {
    if (this.state.status === PromiseStatus.REJECTED) return this.state.reason;

    return undefined;
  }
}

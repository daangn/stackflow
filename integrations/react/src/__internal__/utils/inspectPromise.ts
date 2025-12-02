/**
 * Synchronously inspect the state of an promise
 *
 * @param promise - The target of inspection
 * @returns The state of the promise, or null if the promise is not inspectable
 *
 * @remarks
 *
 * Study 'releasing zalgo' problem before using this function.
 * - https://blog.izs.me/2013/08/designing-apis-for-asynchrony/
 */
export declare function inspectPromise<T>(
  promise: Promise<T>,
): PromiseState<T> | null;

export declare function attachInspectionHint<T>(promise: Promise<T>): void;

export type PromiseState<T> =
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
    };

export const PromiseStatus = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
} as const;

export type PromiseStatus = (typeof PromiseStatus)[keyof typeof PromiseStatus];

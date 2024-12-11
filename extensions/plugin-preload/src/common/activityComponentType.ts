// @ts-ignore: optional peer dependency
import type { ActivityComponentType as ReactActivityComponentType } from "@stackflow/react";
// @ts-ignore: optional peer dependency
import type { ActivityComponentType as SolidActivityComponentType } from "@stackflow/solid";

// each ActivityComponentType will be `any` if the dep is not installed, so convert it to `never` if it's `any`
type NeverOnAny<T> = unknown extends T
  ? [keyof T] extends [never]
    ? T
    : never
  : T;
export type MaybeReactActivityComponentType<
  T extends Record<string, string | undefined>,
> = NeverOnAny<ReactActivityComponentType<T>>;
export type MaybeSolidActivityComponentType<
  T extends Record<string, string | undefined>,
> = NeverOnAny<SolidActivityComponentType<T>>;

export type ActivityParams<T> = T extends MaybeReactActivityComponentType<
  infer U
>
  ? U
  : T extends MaybeSolidActivityComponentType<infer U>
    ? U
    : Record<string, string | undefined>;

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
type MaybeReactActivityComponentType<
  T extends Record<string, string | undefined>,
> = NeverOnAny<ReactActivityComponentType<T>>;
type MaybeSolidActivityComponentType<
  T extends Record<string, string | undefined>,
> = NeverOnAny<SolidActivityComponentType<T>>;

export type Route<K> = {
  path: string;
  decode?: (
    params: Record<string, string>,
  ) => K extends MaybeReactActivityComponentType<infer U>
    ? U
    : K extends MaybeSolidActivityComponentType<infer U>
      ? U
      : {};
};

export type RouteLike<T> = string | string[] | Route<T> | Route<T>[];

/**
 * Type-level assertion helpers for the compile fixtures. `Equal` is the
 * conditional-type identity check (distinguishes `any`, `unknown`, and
 * unions); `Expect` fails compilation unless its argument is `true`.
 */
export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false;

export type Expect<T extends true> = T;

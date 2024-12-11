export type PropOf<T> = T extends (props: infer U) => any ? U : never;

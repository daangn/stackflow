export type PropOf<T> = T extends React.ComponentType<infer U> ? U : never;

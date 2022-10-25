export type RecursivePartial<K> = {
  [attr in keyof K]?: K[attr] extends object
    ? RecursivePartial<K[attr]>
    : K[attr];
};

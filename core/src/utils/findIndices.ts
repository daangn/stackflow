export function findIndices<T>(arr: T[], compare: (t: T) => boolean) {
  return arr
    .map((e, i) => (compare(e) ? i : undefined))
    .filter((output): output is number => typeof output === "number");
}

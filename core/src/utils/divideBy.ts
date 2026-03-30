export const divideBy = <T, U extends T>(
  arr: T[],
  predicate: (t: T) => t is U,
): [U[], T[]] => {
  const satisfied: U[] = [];
  const unsatisfied: T[] = [];

  arr.forEach((element) => {
    if (predicate(element)) {
      satisfied.push(element);
    } else {
      unsatisfied.push(element);
    }
  });

  return [satisfied, unsatisfied];
};

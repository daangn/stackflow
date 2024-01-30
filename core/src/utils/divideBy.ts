export const divideBy = <T>(
  arr: T[],
  predicate: (t: T) => boolean,
): [T[], T[]] => {
  const satisfied: T[] = [];
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

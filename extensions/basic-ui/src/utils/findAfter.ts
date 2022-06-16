export function findAfter<T>(
  arr: T[],
  match: (t: T) => boolean,
): T | undefined {
  for (let i = 0; i < arr.length; i += 1) {
    if (match(arr[i])) {
      return arr[i + 1];
    }
  }

  return undefined;
}

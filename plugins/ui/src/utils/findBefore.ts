export function findBefore<T>(
  arr: T[],
  match: (t: T) => boolean,
): T | undefined {
  let j = -1;

  for (let i = 0; i < arr.length; i += 1) {
    if (match(arr[i])) {
      break;
    }

    j = i;
  }

  return arr[j];
}

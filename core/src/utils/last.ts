export function last<T>(arr: T[]) {
  return arr.length === 0 ? undefined : arr[arr.length - 1];
}

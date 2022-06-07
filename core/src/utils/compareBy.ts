export function compareBy<T>(a: T, b: T, selector: (element: T) => string) {
  const $a = selector(a);
  const $b = selector(b);

  if ($a < $b) {
    return -1;
  }
  if ($a === $b) {
    return 0;
  }
  return 1;
}

export function uniqBy<T>(arr: T[], by: (item: T) => string): T[] {
  const valueMap = new Map<string, true>();

  return arr.filter((item) => {
    const exists = !!valueMap.get(by(item));
    valueMap.set(by(item), true);

    return !exists;
  });
}

export function uniqBy<T>(arr: T[], by: (item: T) => string | null): T[] {
  const valueMap = new Map<string, true>();

  return [...arr]
    .reverse()
    .filter((item) => {
      const key = by(item);

      if (key === null) {
        return true;
      }

      const exists = !!valueMap.get(key);
      valueMap.set(key, true);

      return !exists;
    })
    .reverse();
}

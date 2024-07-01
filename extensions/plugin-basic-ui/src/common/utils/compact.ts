export function compact<T>(arr: Array<T>): Array<NonNullable<T>> {
  return arr.filter(
    (item): item is NonNullable<typeof item> =>
      item !== undefined && item !== null,
  );
}

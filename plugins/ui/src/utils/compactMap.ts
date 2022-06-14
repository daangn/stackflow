export function compactMap<T extends {}>(
  obj: T,
): {
  [key in keyof T]: NonNullable<T[key]>;
} {
  return Object.entries(obj).reduce<any>((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }

    return acc;
  }, {});
}

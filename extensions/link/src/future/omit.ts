export function omit<T extends {}, K extends keyof T>(
  obj: T,
  fieldNames: K[],
): Omit<T, K> {
  const output = { ...obj };

  fieldNames.forEach((fieldName) => {
    delete output[fieldName];
  });

  return output;
}

export function omit<T extends {}, K extends keyof T>(
  obj: T,
  fields: K[],
): Omit<T, K> {
  const output = {
    ...obj,
  };

  fields.forEach((field) => {
    delete output[field];
  });

  return output;
}

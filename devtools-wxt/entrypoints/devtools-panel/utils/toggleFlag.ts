export default function toggleFlag(
  obj: any,
  keys: string[],
  flag: string,
): any {
  if (keys.length === 0) {
    const newValue = !obj[flag];
    return Object.freeze({
      ...obj,
      [flag]: newValue,
    });
  }
  const [currentKey, ...remainingKeys] = keys;
  const currentValue = obj[currentKey];
  const newValue = toggleFlag(
    currentValue !== undefined ? currentValue : {},
    remainingKeys,
    flag,
  );
  if (currentValue === newValue) {
    return Object.freeze(obj);
  }
  return Object.freeze({
    ...obj,
    [currentKey]: newValue,
  });
}

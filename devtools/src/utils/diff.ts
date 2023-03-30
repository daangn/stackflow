export default function diff(obj1: any, obj2: any) {
  const result: any = {};

  // check if the values in obj1 differ from obj2
  for (const key in obj1) {
    const value1 = obj1[key];
    const value2 = obj2[key];

    if (typeof value1 !== typeof value2) {
      result[key] = { $value: true };
    } else if (typeof value1 === "object" && value1 !== null) {
      const subResult = diff(value1, value2);
      if (Object.keys(subResult).length > 0) {
        result[key] = subResult;
      }
    } else if (value1 !== value2) {
      result[key] = { $value: true };
    }
  }

  // check if there are extra keys in obj2 that are not present in obj1
  for (const key in obj2) {
    if (!(key in obj1)) {
      result[key] = { $key: true };
    }
  }

  return result;
}

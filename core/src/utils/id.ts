let counterMap = new Map<string, number>();

export function id() {
  const t = new Date().getTime().toString();

  const prevCounter = counterMap.get(t);
  const nextCounter = prevCounter !== undefined ? prevCounter + 1 : 0;

  if (nextCounter === 0) {
    counterMap = new Map();
  }

  counterMap.set(t, nextCounter);

  return Number(`${t}${nextCounter.toString().padStart(2, "0")}`).toString(16);
}

export function makeRef<T>(): [() => T | null, (value: T) => void] {
  const ref: {
    value: T | null;
  } = {
    value: null,
  };
  function get() {
    return ref.value;
  }
  function set(value: T) {
    ref.value = value;
  }

  return [get, set];
}

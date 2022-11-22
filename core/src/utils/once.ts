export function once(cb: () => void) {
  let called = false;

  return () => {
    if (called) {
      return;
    }
    called = true;

    cb();
  };
}

const nextTick = () =>
  new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });

export const loop = (cb: () => void) => {
  let disposed = false;

  (async () => {
    while (!disposed) {
      // eslint-disable-next-line no-await-in-loop
      await nextTick();

      cb();
    }
  })();

  return {
    dispose() {
      disposed = true;
    },
  };
};

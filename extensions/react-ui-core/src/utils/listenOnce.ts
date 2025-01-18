export function listenOnce<T extends HTMLElement>(
  el: T,
  types: Array<keyof HTMLElementEventMap>,
  cb: () => void,
) {
  const listener = () => {
    types.forEach((type) => {
      el.removeEventListener(type, listener);
    });
    cb();
  };

  types.forEach((type) => {
    el.addEventListener(type, listener);
  });
}

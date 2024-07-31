export function listenOnce<T extends HTMLElement>(
  el: T,
  type: keyof HTMLElementEventMap,
  cb: () => void,
) {
  const listener = () => {
    el.removeEventListener(type, listener);
    cb();
  };

  el.addEventListener(type, listener);
}

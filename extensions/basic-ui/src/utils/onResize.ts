export const onResize = (cb: () => void) => {
  cb();
  window.addEventListener("resize", cb);

  return () => {
    window.removeEventListener("resize", cb);
  };
};

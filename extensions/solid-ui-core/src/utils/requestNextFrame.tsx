// https://github.com/MingruiZhang/react-animate-mount/blob/32300c04a4fdfa97724b70aaaf0c0f403d6da247/src/Animate.js#L171-L179
export function requestNextFrame(cb: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cb();
    });
  });
}

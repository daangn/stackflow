export function nextTick(callback: () => void) {
  return Promise.resolve().then(callback)
}

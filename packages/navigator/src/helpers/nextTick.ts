export function nextTick(callback: () => void) {
  setTimeout(callback, 0)
}

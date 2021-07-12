let screenInstanceIdCount = 0

export function generateScreenInstanceId() {
  screenInstanceIdCount += 1
  return String(screenInstanceIdCount)
}

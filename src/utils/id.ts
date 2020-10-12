let screenIdCount = 0
let screenInstanceIdCount = 0

export function generateScreenId() {
  screenIdCount += 1
  return String(screenIdCount)
}

export function generateScreenInstanceId() {
  screenInstanceIdCount += 1
  return String(screenInstanceIdCount)
}

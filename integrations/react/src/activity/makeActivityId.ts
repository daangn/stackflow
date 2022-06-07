export function makeActivityId() {
  return `Activity#${new Date().getTime().toString()}`;
}

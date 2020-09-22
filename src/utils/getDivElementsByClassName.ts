// eslint-disable-next-line
export function getDivElementsByClassName(className: string): HTMLCollectionOf<HTMLDivElement> {
  return document.getElementsByClassName(className) as any
}

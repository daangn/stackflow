export function pipe<P, Q>(f1: () => P, f2: (p: P) => Q) {
  return function execute(): Q {
    return f2(f1())
  }
}

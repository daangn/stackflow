export function makeTranslate(
  element: HTMLElement,
  options?: {
    enableTransition?: boolean
  }
) {
  const enableTransition = options?.enableTransition ?? false

  let rAFLock = false

  function translate({ y }: { y: number }) {
    let _listener: ((y: number) => void) | null = null

    if (!rAFLock) {
      rAFLock = true
      requestAnimationFrame(() => {
        element.style.transform = `translateY(${y}px)`

        if (y !== 0) {
          element.style.overflow = 'hidden'
        }
        if (enableTransition) {
          element.style.transition = ''
        } else {
          element.style.transition = '0s'
        }

        _listener?.(y)
        rAFLock = false
      })
    }

    return {
      then(listener: (y: number) => void) {
        _listener = listener

        return function dispose() {
          _listener = null
        }
      },
    }
  }

  function reset() {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        element.style.transform = ''
        element.style.transition = ''
        element.style.overflow = ''
        resolve()
      })
    })
  }

  return {
    translate,
    reset,
  }
}

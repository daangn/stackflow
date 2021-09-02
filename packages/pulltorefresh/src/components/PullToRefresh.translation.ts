const css = String.raw

export function makeTranslation(element: HTMLElement) {
  let _rAFLock = false

  return {
    translate({
      y,
      smooth,
      force,
      onAnimationFrame,
    }: {
      y: number
      smooth?: boolean
      force?: boolean
      onAnimationFrame?: (dy: number) => void
    }) {
      if (force || !_rAFLock) {
        _rAFLock = true

        requestAnimationFrame(() => {
          if (y === 0) {
            element.style.cssText = ''
          } else {
            element.style.cssText = css`
              transform: translateY(${y}px);
              overflow: hidden;

              ${!smooth
                ? css`
                    transition: 0s;
                  `
                : ''}
            `
          }

          onAnimationFrame?.(y)
          _rAFLock = false
        })
      }
    },
    resetTranslation() {
      requestAnimationFrame(() => {
        element.style.cssText = ''
      })
    },
  }
}

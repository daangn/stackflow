const MAX_FRAME_OFFSET = 80

const css = String.raw

export function makeTranslation({
  $dim,
  $frame,
  $frameOffset,
}: {
  $dim: HTMLElement
  $frame: HTMLElement
  $frameOffset: HTMLElement
}) {
  let _rAFLock = false

  return {
    translate({
      dx,
      force,
      onAnimationFrame,
    }: {
      dx: number
      force?: boolean
      onAnimationFrame?: (dx: number) => void
    }) {
      if (force || !_rAFLock) {
        _rAFLock = true

        requestAnimationFrame(() => {
          const p = dx / window.screen.width

          $dim.style.cssText = css`
            opacity: ${1 - p};
            transition: opacity 0s;
          `
          $frame.style.cssText = css`
            overflow-y: hidden;
            transform: translateX(${dx}px);
            transition: transform 0s;
          `
          $frameOffset.style.cssText = css`
            transform: translateX(${-1 * (1 - p) * MAX_FRAME_OFFSET}px);
            transition: transform 0s;
          `

          onAnimationFrame?.(dx)
          _rAFLock = false
        })
      }
    },
    resetTranslation() {
      requestAnimationFrame(() => {
        $dim.style.cssText = ''
        $frame.style.cssText = ''
        $frameOffset.style.cssText = ''
      })
    },
  }
}

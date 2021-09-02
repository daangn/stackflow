const css = String.raw

export function makeTranslation({
  tabCount,
  $tabMains,
  $tabBarIndicator,
}: {
  tabCount: number
  $tabMains: HTMLDivElement
  $tabBarIndicator: HTMLDivElement
}) {
  let _rAFLock = false

  return {
    translate({
      activeTabIndex,
      dx,
      force,
    }: {
      activeTabIndex: number
      dx?: number
      force?: boolean
    }) {
      if (force || !_rAFLock) {
        _rAFLock = true

        requestAnimationFrame(() => {
          if (dx) {
            const tabWidth = $tabMains.clientWidth / tabCount
            const minTranslateX = -1 * tabWidth * (tabCount - 1)
            const maxTranslateX = 0
            const baseTranslateX = -1 * tabWidth * activeTabIndex

            const translateX = Math.min(
              Math.max(baseTranslateX + dx, minTranslateX),
              maxTranslateX
            )

            $tabMains.style.cssText = css`
              transform: translateX(${translateX}px);
              transition: transform 0s;
            `
            $tabBarIndicator.style.cssText = css`
              transform: translateX(${(-1 * translateX) / tabCount}px);
              transition: transform 0s;
            `
            for (let i = 0; i < $tabMains.children.length; i++) {
              ;($tabMains.children[i] as HTMLDivElement).style.cssText = css`
                visibility: visible;
                transition: visibility 0s 0s;
              `
            }
          } else {
            $tabMains.style.cssText = ''
            $tabBarIndicator.style.cssText = ''
            for (let i = 0; i < $tabMains.children.length; i++) {
              ;($tabMains.children[i] as HTMLDivElement).style.cssText = ''
            }
          }
          _rAFLock = false
        })
      }
    },
    resetTranslation() {
      requestAnimationFrame(() => {
        $tabMains.style.cssText = ''
        $tabBarIndicator.style.cssText = ''
        for (let i = 0; i < $tabMains.children.length; i++) {
          ;($tabMains.children[i] as HTMLDivElement).style.cssText = ''
        }
      })
    },
  }
}

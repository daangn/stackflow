const css = String.raw

export function makeTranslation({
  tabCount,
  activeTabIndex,
  $tabBar,
  $tabBarIndicator,
  $tabMains,
  useInlineButtons,
}: {
  tabCount: number
  activeTabIndex: number
  $tabBar: HTMLDivElement
  $tabBarIndicator: HTMLDivElement
  $tabMains: HTMLDivElement
  useInlineButtons?: boolean
}) {
  let _rAFLock = false

  return {
    translate({ dx, force }: { dx: number; force?: boolean }) {
      if (force || !_rAFLock) {
        _rAFLock = true

        requestAnimationFrame(() => {
          const tabWidth = $tabMains.clientWidth / tabCount
          const minTranslateX = -1 * tabWidth * (tabCount - 1)
          const maxTranslateX = 0
          const baseTranslateX = -1 * tabWidth * activeTabIndex

          const translateX = Math.min(
            Math.max(baseTranslateX + dx, minTranslateX),
            maxTranslateX
          )

          if (useInlineButtons) {
            const { clientWidth: fullWidth } = $tabBarIndicator

            const i = -1 * (translateX / fullWidth)
            const p = i % 1

            const left = $tabBar.children[Math.floor(i) + 1] as HTMLDivElement
            const right = $tabBar.children[Math.ceil(i) + 1] as HTMLDivElement

            const { offsetLeft: xl, clientWidth: wl } = left
            const { offsetLeft: xr, clientWidth: wr } = right

            const x = xl + (xr - xl) * p
            const scaleX = (wl + (wr - wl) * p) / fullWidth

            $tabBarIndicator.style.cssText = css`
              transform: translateX(${x}px) scaleX(${scaleX});
              transition: transform 0s;
            `
          } else {
            $tabBarIndicator.style.cssText = css`
              transform: translateX(${(-1 * translateX) / tabCount}px);
              transition: transform 0s;
            `
          }

          $tabMains.style.cssText = css`
            transform: translateX(${translateX}px);
            transition: transform 0s;
          `
          for (let i = 0; i < $tabMains.children.length; i++) {
            ;($tabMains.children[i] as HTMLDivElement).style.cssText = css`
              visibility: visible;
              transition: visibility 0s 0s;
            `
          }

          _rAFLock = false
        })
      }
    },
    resetTranslation() {
      requestAnimationFrame(() => {
        $tabBarIndicator.style.cssText = ''
        $tabMains.style.cssText = ''

        for (let i = 0; i < $tabMains.children.length; i++) {
          ;($tabMains.children[i] as HTMLDivElement).style.cssText = ''
        }
      })
    },
  }
}

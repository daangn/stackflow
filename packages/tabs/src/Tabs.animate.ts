import { State } from './Tabs.reducer'

export function makeAnimate({
  tabCount,
  tabMains,
  tabBarIndicator,
}: {
  tabCount: number
  tabMains: HTMLDivElement
  tabBarIndicator: HTMLDivElement
}) {
  function animate(state: State) {
    if (state._t === 'swipe_started') {
      if (tabMains) {
        const { translateX } = state
        tabMains.style.transform = `translateX(${translateX}px)`
        tabMains.style.transition = `transform 0s`

        for (let i = 0; i < tabMains.children.length; i++) {
          ;(tabMains.children[i] as HTMLDivElement).style.visibility = 'visible'
          ;(tabMains.children[i] as HTMLDivElement).style.transition =
            'visibility 0s 0s'
        }
      }
      if (tabBarIndicator) {
        const translateX = -state.translateX / tabCount
        tabBarIndicator.style.transform = `translateX(${translateX}px)`
        tabBarIndicator.style.transition = `transform 0s`
      }
    } else {
      if (tabMains) {
        tabMains.style.transform = ''
        tabMains.style.transition = ''

        for (let i = 0; i < tabMains.children.length; i++) {
          ;(tabMains.children[i] as HTMLDivElement).style.visibility = ''
          ;(tabMains.children[i] as HTMLDivElement).style.transition = ''
        }
      }
      if (tabBarIndicator) {
        tabBarIndicator.style.transform = ''
        tabBarIndicator.style.transition = ''
      }
    }
  }

  return animate
}

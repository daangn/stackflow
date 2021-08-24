export type State =
  | {
      _t: 'idle'
    }
  | {
      _t: 'touch_started'
      touchStartX: number
      touchStartY: number
    }
  | {
      _t: 'swipe_started'
      touchStartX: number
      touchStartY: number
      translateX: number
    }
  | {
      _t: 'swipe_canceled'
    }

export type Action =
  | {
      _t: 'TOUCH_START'
      x: number
      y: number
    }
  | {
      _t: 'TOUCH_MOVE'
      x: number
      y: number
      e: TouchEvent
    }
  | {
      _t: 'TOUCH_END'
      e: TouchEvent
    }

export const makeReducer =
  ({
    mainWidth,
    tabCount,
    activeTabIndex,
    onNextTab,
    onPreviousTab,
  }: {
    mainWidth: number
    tabCount: number
    activeTabIndex: number
    onNextTab?: () => void
    onPreviousTab?: () => void
  }) =>
  (prevState: State, action: Action): State => {
    const minTranslateX = -mainWidth * (tabCount - 1)
    const maxTranslateX = 0
    const baseTranslateX = -mainWidth * activeTabIndex

    switch (action._t) {
      case 'TOUCH_START': {
        if (action.x < 0) {
          return {
            _t: 'swipe_canceled',
          }
        }

        switch (prevState._t) {
          case 'idle':
            return {
              _t: 'touch_started',
              touchStartX: action.x,
              touchStartY: action.y,
            }
          default:
            break
        }

        return {
          ...prevState,
        }
      }
      case 'TOUCH_MOVE': {
        if (action.x < 0) {
          return {
            _t: 'swipe_canceled',
          }
        }

        switch (prevState._t) {
          case 'idle': {
            return {
              _t: 'touch_started',
              touchStartX: action.x,
              touchStartY: action.y,
            }
          }
          case 'touch_started': {
            const xDiff = Math.abs(prevState.touchStartX - action.x)
            const yDiff = Math.abs(prevState.touchStartY - action.y)

            const distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2))

            if (distance > 10 && distance < 50) {
              if (xDiff / yDiff > 2) {
                action.e.stopPropagation()
                return {
                  ...prevState,
                  _t: 'swipe_started',
                  translateX: baseTranslateX,
                }
              } else {
                return {
                  _t: 'swipe_canceled',
                }
              }
            }

            break
          }
          case 'swipe_started': {
            action.e.preventDefault()
            action.e.stopPropagation()
            const nextTranslateX =
              baseTranslateX + action.x - prevState.touchStartX

            return {
              ...prevState,
              translateX:
                nextTranslateX < maxTranslateX && nextTranslateX > minTranslateX
                  ? nextTranslateX
                  : baseTranslateX,
            }
          }
          case 'swipe_canceled':
          default: {
            break
          }
        }

        return {
          ...prevState,
        }
      }
      case 'TOUCH_END': {
        switch (prevState._t) {
          case 'swipe_started': {
            action.e.stopPropagation()
            const diff = prevState.translateX - baseTranslateX

            if (diff < -100) {
              onNextTab?.()
            }
            if (diff >= 100) {
              onPreviousTab?.()
            }
            break
          }
          default: {
            break
          }
        }

        return {
          _t: 'idle',
        }
      }
    }
  }

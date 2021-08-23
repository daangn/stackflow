import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { assignInlineVars } from '@vanilla-extract/dynamic'

import {
  container,
  indicator,
  main,
  mains,
  nav,
  navTab,
  vars,
} from './Tabs.css'
import { TabsControllerContext } from './useTabsController'

interface Tab {
  /**
   * Unique key for each tab
   */
  key: string

  /**
   * Tab name
   */
  name: string

  /**
   * Whether capture or bubble in touch event
   */
  useCapture?: boolean

  /**
   * Tab contents
   */
  render: () => React.ReactNode
}

const TabsContext = createContext<{
  swipeEnabledRef: React.MutableRefObject<boolean>
}>(null as any)

interface TabsProps {
  /**
   * Tabs
   */
  tabs: Tab[]

  /**
   * Active tab's key
   */
  activeTabKey: string

  /**
   * Called when tab changed
   */
  onTabChange: (key: string, changedBy?: 'click' | 'swipe') => void
}
const Tabs: React.FC<TabsProps> = (props) => {
  const activeTabIndex =
    props.tabs.findIndex((tab) => tab.key === props.activeTabKey) !== -1
      ? props.tabs.findIndex((tab) => tab.key === props.activeTabKey)
      : 0

  const containerRef = useRef<HTMLDivElement>(null)
  const mainsRef = useRef<HTMLDivElement>(null)
  const navIndicatorRef = useRef<HTMLDivElement>(null)

  const swipeEnabledRef = useRef(true)

  const [lazyMap, setLazyMap] = useState<{
    [tabKey: string]: true | undefined
  }>({})

  useEffect(() => {
    setLazyMap((prevState) => ({
      ...prevState,
      [props.activeTabKey]: true,
    }))
  }, [props.activeTabKey])

  useEffect(() => {
    const container = containerRef.current
    const mains = mainsRef.current
    const navIndicator = navIndicatorRef.current

    if (!container || !mains || !navIndicator) {
      return
    }

    type State =
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

    type Action =
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

    let state: State = {
      _t: 'idle',
    }

    const reducer = (prevState: State, action: Action): State => {
      const mainWidth = container.clientWidth
      const minTranslateX = -mainWidth * (props.tabs.length - 1)
      const maxTranslateX = 0

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
              const baseTranslateX = -mainWidth * activeTabIndex

              const distance = Math.sqrt(
                Math.pow(xDiff, 2) + Math.pow(yDiff, 2)
              )

              if (distance > 10 && distance < 50) {
                if (xDiff / yDiff > 2) {
                  action.e.stopPropagation()
                  requestAnimationFrame(animate)
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
              const baseTranslateX = -mainWidth * activeTabIndex
              const nextTranslateX =
                baseTranslateX + action.x - prevState.touchStartX

              return {
                ...prevState,
                translateX:
                  nextTranslateX < maxTranslateX &&
                  nextTranslateX > minTranslateX
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
              const baseTranslateX = -mainWidth * activeTabIndex
              const diff = prevState.translateX - baseTranslateX

              if (diff < -100) {
                props.onTabChange(props.tabs[activeTabIndex + 1].key, 'swipe')
              }
              if (diff >= 100) {
                props.onTabChange(props.tabs[activeTabIndex - 1].key, 'swipe')
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

    const dispatch = (action: Action) => {
      state = reducer(state, action)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!swipeEnabledRef.current) {
        return
      }
      dispatch({
        _t: 'TOUCH_START',
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      })
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!swipeEnabledRef.current) {
        return
      }
      dispatch({
        _t: 'TOUCH_MOVE',
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        e,
      })
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!swipeEnabledRef.current) {
        return
      }
      dispatch({
        _t: 'TOUCH_END',
        e,
      })
    }

    const animate = () => {
      if (state._t === 'swipe_started') {
        if (mains) {
          const { translateX } = state
          mains.style.transform = `translateX(${translateX}px)`
          mains.style.transition = `transform 0s`

          for (let i = 0; i < mains.children.length; i++) {
            ;(mains.children[i] as HTMLDivElement).style.visibility = 'visible'
            ;(mains.children[i] as HTMLDivElement).style.transition =
              'visibility 0s 0s'
          }
        }
        if (navIndicator) {
          const translateX = -state.translateX / props.tabs.length
          navIndicator.style.transform = `translateX(${translateX}px)`
          navIndicator.style.transition = `transform 0s`
        }
        requestAnimationFrame(animate)
      } else {
        if (mains) {
          mains.style.transform = ''
          mains.style.transition = ''

          for (let i = 0; i < mains.children.length; i++) {
            ;(mains.children[i] as HTMLDivElement).style.visibility = ''
            ;(mains.children[i] as HTMLDivElement).style.transition = ''
          }
        }
        if (navIndicator) {
          navIndicator.style.transform = ''
          navIndicator.style.transition = ''
        }
      }
    }

    const useCapture = props.tabs[activeTabIndex]?.useCapture ?? false

    mains.addEventListener('touchstart', onTouchStart, useCapture)
    mains.addEventListener('touchmove', onTouchMove, {
      capture: useCapture,
      passive: false,
    })
    mains.addEventListener('touchend', onTouchEnd, useCapture)

    return () => {
      mains.removeEventListener('touchstart', onTouchStart, useCapture)
      mains.removeEventListener('touchmove', onTouchMove, useCapture)
      mains.removeEventListener('touchend', onTouchEnd, useCapture)
    }
  }, [props, mainsRef, navIndicatorRef, activeTabIndex])

  const enableSwipe = useCallback(() => {
    swipeEnabledRef.current = true
  }, [swipeEnabledRef])

  const disableSwipe = useCallback(() => {
    swipeEnabledRef.current = false
  }, [swipeEnabledRef])

  return (
    <TabsContext.Provider
      value={useMemo(() => ({ swipeEnabledRef }), [swipeEnabledRef])}
    >
      <TabsControllerContext.Provider
        value={useMemo(
          () => ({ enableSwipe, disableSwipe }),
          [enableSwipe, disableSwipe]
        )}
      >
        <div
          ref={containerRef}
          className={container}
          style={assignInlineVars({
            [vars.tabBar.indicator.width]: `${100 / props.tabs.length}%`,
            [vars.tabBar.indicator.transform]: `translateX(${
              activeTabIndex * 100 + '%'
            })`,
            [vars.tabMain.width]: `${props.tabs.length * 100}%`,
            [vars.tabMain.transform]: `translateX(
              -${activeTabIndex * (100 / props.tabs.length) + '%'}
            )`,
          })}
        >
          <div
            className={nav({
              active: props.tabs.length > 0,
            })}
          >
            {props.tabs.map((tab) => (
              <a
                key={tab.key}
                role="tab"
                aria-label={tab.name}
                className={navTab({
                  active: props.activeTabKey === tab.key,
                })}
                onClick={() => {
                  props.onTabChange(tab.key, 'click')
                }}
              >
                {tab.name}
              </a>
            ))}
            <div className={indicator} ref={navIndicatorRef} />
          </div>
          <div ref={mainsRef} className={mains}>
            {props.tabs.map((tab, tabIndex) => (
              <div
                key={tab.key}
                className={main({
                  active: activeTabIndex === tabIndex,
                })}
              >
                {lazyMap[tab.key] && tab.render()}
              </div>
            ))}
          </div>
        </div>
      </TabsControllerContext.Provider>
    </TabsContext.Provider>
  )
}

export default Tabs

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { assignInlineVars } from '@vanilla-extract/dynamic'

import { makeAnimate } from './Tabs.animate'
import * as css from './Tabs.css'
import { Action, makeReducer, State } from './Tabs.reducer'
import { TabsControllerContext } from './useTabsController'

export interface ITab {
  /**
   * Unique key for each tab
   */
  key: string

  /**
   * Tab button label
   */
  buttonLabel: string

  /**
   * Tab contents
   */
  render: () => React.ReactNode

  /**
   * Whether capture or bubble in touch event
   */
  useCapture?: boolean
}

interface ITabsProps {
  /**
   * Tabs
   */
  tabs: ITab[]

  /**
   * Active tab's key
   */
  activeTabKey: string

  /**
   * Called when tab changed
   */
  onTabChange: (key: string, changedBy?: 'click' | 'swipe') => void

  /**
   * Class name appended to root div element
   */
  className?: string
}

const TabsContext = createContext<{
  swipeEnabledRef: React.MutableRefObject<boolean>
}>(null as any)

const Tabs: React.FC<ITabsProps> = (props) => {
  const activeTabIndex =
    props.tabs.findIndex((tab) => tab.key === props.activeTabKey) !== -1
      ? props.tabs.findIndex((tab) => tab.key === props.activeTabKey)
      : 0

  const containerRef = useRef<HTMLDivElement>(null)
  const tabMainsRef = useRef<HTMLDivElement>(null)
  const tabBarIndicatorRef = useRef<HTMLDivElement>(null)

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
    const container = containerRef.current!
    const tabBarIndicator = tabBarIndicatorRef.current!
    const tabMains = tabMainsRef.current!

    let state: State = {
      _t: 'idle',
    }

    const animate = makeAnimate({
      tabCount: props.tabs.length,
      tabBarIndicator: tabBarIndicator,
      tabMains: tabMains,
    })

    const reducer = makeReducer({
      tabCount: props.tabs.length,
      activeTabIndex,
      mainWidth: container.clientWidth,
      onNextTab() {
        props.onTabChange(props.tabs[activeTabIndex + 1].key, 'swipe')
      },
      onPreviousTab() {
        props.onTabChange(props.tabs[activeTabIndex - 1].key, 'swipe')
      },
    })

    let rAFLock = false
    const dispatch = (action: Action) => {
      state = reducer(state, action)

      if (!rAFLock) {
        rAFLock = true
        requestAnimationFrame(() => {
          animate(state)
          rAFLock = false
        })
      }
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

    const capture = props.tabs[activeTabIndex]?.useCapture ?? false

    tabMains.addEventListener('touchstart', onTouchStart, capture)
    tabMains.addEventListener('touchmove', onTouchMove, {
      capture,
      passive: false,
    })
    tabMains.addEventListener('touchend', onTouchEnd, capture)

    return () => {
      tabMains.removeEventListener('touchstart', onTouchStart, capture)
      tabMains.removeEventListener('touchmove', onTouchMove, capture)
      tabMains.removeEventListener('touchend', onTouchEnd, capture)
    }
  }, [props, tabMainsRef, tabBarIndicatorRef, activeTabIndex])

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
          className={[
            css.container,
            ...(props.className ? [props.className] : []),
          ].join(' ')}
          style={assignInlineVars({
            [css.vars.tabBar.indicator.width]: 100 / props.tabs.length + '%',
            [css.vars.tabBar.indicator.transform]:
              'translateX(' + activeTabIndex * 100 + '%)',
            [css.vars.tabMain.width]: props.tabs.length * 100 + '%',
            [css.vars.tabMain.transform]:
              'translateX(' +
              -1 * activeTabIndex * (100 / props.tabs.length) +
              '%)',
          })}
        >
          <div className={css.tabBar}>
            {props.tabs.map((tab) => (
              <a
                key={tab.key}
                role="tab"
                aria-label={tab.buttonLabel}
                className={
                  css.tabBarItem[
                    props.activeTabKey === tab.key ? 'active' : 'normal'
                  ]
                }
                onClick={() => {
                  props.onTabChange(tab.key, 'click')
                }}
              >
                {tab.buttonLabel}
              </a>
            ))}
            <div ref={tabBarIndicatorRef} className={css.tabBarIndicator} />
          </div>
          <div ref={tabMainsRef} className={css.tabMains}>
            {props.tabs.map((tab) => (
              <div
                key={tab.key}
                className={
                  css.tabMain[
                    props.activeTabKey === tab.key ? 'active' : 'hidden'
                  ]
                }
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

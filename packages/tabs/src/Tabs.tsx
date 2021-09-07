import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { assignInlineVars } from '@vanilla-extract/dynamic'

import { pipe } from './pipe'
import * as css from './Tabs.css'
import { makeState } from './Tabs.state'
import { makeTranslation } from './Tabs.translation'
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
   * Component to render in a tab
   */
  component: React.ComponentType

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
  onTabChange: (key: string) => void

  /**
   * Class name appended to root div element
   */
  className?: string

  /**
   * Disable swipe
   */
  disableSwipe?: boolean
}

const Tabs: React.FC<ITabsProps> = (props) => {
  const tabCount = props.tabs.length
  const activeTabIndex =
    props.tabs.findIndex((tab) => tab.key === props.activeTabKey) !== -1
      ? props.tabs.findIndex((tab) => tab.key === props.activeTabKey)
      : 0

  const containerRef = useRef<HTMLDivElement>(null)
  const tabMainsRef = useRef<HTMLDivElement>(null)
  const tabBarIndicatorRef = useRef<HTMLDivElement>(null)

  const [isSwipeDisabled, setIsSwipeDisabled] = useState(true)

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
    setIsSwipeDisabled(props.disableSwipe ?? false)
  }, [props.disableSwipe])

  useEffect(() => {
    const $tabBarIndicator = tabBarIndicatorRef.current
    const $tabMains = tabMainsRef.current

    if (!$tabBarIndicator || !$tabMains) {
      return
    }

    const { dispatch, addEffect } = makeState({
      _t: 'idle',
      tabCount,
      activeTabIndex,
    })

    const { translate, resetTranslation } = makeTranslation({
      tabCount,
      activeTabIndex,
      $tabMains,
      $tabBarIndicator,
    })

    const dispose = pipe(
      addEffect((state) => {
        if (state._t === 'swipe_started') {
          translate({
            dx: state.dx,
          })
        } else {
          resetTranslation()
        }
      }),
      addEffect((state) => {
        if (
          activeTabIndex !== state.activeTabIndex &&
          props.tabs[state.activeTabIndex]?.key
        ) {
          props.onTabChange(props.tabs[state.activeTabIndex].key)
        }
      })
    )

    const onTouchStart = (e: TouchEvent) => {
      if (isSwipeDisabled) {
        dispatch({ _t: 'TOUCH_END', e })
      } else {
        dispatch({ _t: 'TOUCH_START', e })
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (isSwipeDisabled) {
        dispatch({ _t: 'TOUCH_END', e })
      } else {
        dispatch({ _t: 'TOUCH_MOVE', e })
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      dispatch({ _t: 'TOUCH_END', e })
    }

    const capture = props.tabs[activeTabIndex]?.useCapture ?? false

    $tabMains.addEventListener('touchstart', onTouchStart, {
      passive: true,
      capture,
    })
    $tabMains.addEventListener('touchmove', onTouchMove, {
      passive: true,
      capture,
    })
    $tabMains.addEventListener('touchend', onTouchEnd, {
      passive: true,
      capture,
    })

    return () => {
      $tabMains.removeEventListener('touchstart', onTouchStart, capture)
      $tabMains.removeEventListener('touchmove', onTouchMove, capture)
      $tabMains.removeEventListener('touchend', onTouchEnd, capture)
      dispose()
    }
  }, [
    props,
    tabMainsRef,
    tabBarIndicatorRef,
    tabCount,
    activeTabIndex,
    isSwipeDisabled,
  ])

  const go = useCallback((tabKey: string) => {
    if (props.tabs.find((tab) => tab.key === tabKey)) {
      props.onTabChange(tabKey)
    }
  }, [])

  const enableSwipe = useCallback(() => {
    setIsSwipeDisabled(false)
  }, [])

  const disableSwipe = useCallback(() => {
    setIsSwipeDisabled(true)
  }, [])

  return (
    <TabsControllerContext.Provider
      value={useMemo(
        () => ({
          go,
          enableSwipe,
          disableSwipe,
        }),
        [go, enableSwipe, disableSwipe]
      )}
    >
      <div
        ref={containerRef}
        className={[
          css.container,
          ...(props.className ? [props.className] : []),
        ].join(' ')}
        style={assignInlineVars({
          [css.vars.tabBar.indicator.width]: 100 / tabCount + '%',
          [css.vars.tabBar.indicator.transform]:
            'translateX(' + activeTabIndex * 100 + '%)',
          [css.vars.tabMain.width]: tabCount * 100 + '%',
          [css.vars.tabMain.transform]:
            'translateX(' + -1 * activeTabIndex * (100 / tabCount) + '%)',
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
                props.onTabChange(tab.key)
              }}
            >
              {tab.buttonLabel}
            </a>
          ))}
          <div ref={tabBarIndicatorRef} className={css.tabBarIndicator} />
        </div>
        <div ref={tabMainsRef} className={css.tabMains}>
          {props.tabs.map(({ key, component: Component }) => (
            <div
              key={key}
              className={
                css.tabMain[props.activeTabKey === key ? 'active' : 'hidden']
              }
            >
              {lazyMap[key] && <Component />}
            </div>
          ))}
        </div>
      </div>
    </TabsControllerContext.Provider>
  )
}

export default Tabs

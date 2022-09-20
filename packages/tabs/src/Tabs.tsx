import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'

import { assignInlineVars } from '@vanilla-extract/dynamic'

import { pipe } from './pipe'
import * as css from './Tabs.css'
import { makeState } from './Tabs.state'
import { makeTranslation } from './Tabs.translation'
import { ContextTabsController } from './useTabsController'

export type ITab = {
  /**
   * Unique key for each tab
   */
  key: string

  /**
   * render in a tab
   */
  render: () => React.ReactNode

  /**
   * Whether capture or bubble in touch event
   */
  useCapture?: boolean
} & (
  | {
      /**
       * Tab button label
       */
      buttonLabel: string
    }
  | {
      /**
       * Tab button label
       */
      buttonLabel: React.ReactNode

      /**
       * Tab button aria label
       */
      buttonAriaLabel: string
    }
)

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
  onTabChange: (key: string, info: { swiped: boolean }) => void

  /**
   * Class name appended to root div element
   */
  className?: string

  /**
   * Disable swipe
   */
  disableSwipe?: boolean

  /**
   * Whether use inline or fixed buttons in tabs
   */
  useInlineButtons?: true
}

const Tabs: React.FC<ITabsProps> = (props) => {
  const tabCount = props.tabs.length
  const activeTabIndex =
    props.tabs.findIndex((tab) => tab.key === props.activeTabKey) !== -1
      ? props.tabs.findIndex((tab) => tab.key === props.activeTabKey)
      : 0

  const containerRef = useRef<HTMLDivElement>(null)
  const tabMainsRef = useRef<HTMLDivElement>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const tabBarIndicatorRef = useRef<HTMLDivElement>(null)

  const mounted = useMounted()
  const [isSwipeDisabled, setIsSwipeDisabled] = useState(true)
  const [tabBarIndicatorTransform, setTabBarIndicatorTransform] =
    useState<string>('')

  const [lazyMap, setLazyMap] = useState<{
    [tabKey: string]: true | undefined
  }>({
    [props.activeTabKey]: true,
  })

  useEffect(() => {
    setLazyMap((prevState) => ({
      ...prevState,
      [props.activeTabKey]: true,
    }))
  }, [props.activeTabKey])

  useEffect(() => {
    if (!props.useInlineButtons) {
      return
    }

    showActiveTab(props.tabs[activeTabIndex])
  }, [props.useInlineButtons, activeTabIndex])

  useEffect(() => {
    setIsSwipeDisabled(props.disableSwipe ?? false)
  }, [props.disableSwipe])

  const showActiveTab = (tab: ITab) => {
    const MIN_SCROLL_MARGIN = 64
    const nextTabIndex = props.tabs.findIndex((t) => t === tab)

    const $tabBar = tabBarRef.current
    const $tabBarItem = $tabBar?.children[nextTabIndex + 1] as
      | HTMLDivElement
      | undefined

    if (!$tabBar || !$tabBarItem) {
      return
    }

    const { clientWidth: fullWidth, scrollLeft } = $tabBar
    const { offsetLeft: itemLeft, clientWidth: itemWidth } = $tabBarItem

    const minScrollLeft = itemLeft + itemWidth + MIN_SCROLL_MARGIN - fullWidth
    const maxScrollLeft = itemLeft - MIN_SCROLL_MARGIN

    if (scrollLeft < minScrollLeft) {
      $tabBar.scroll({
        left: minScrollLeft,
        behavior: 'smooth',
      })
    }
    if (scrollLeft > maxScrollLeft) {
      $tabBar.scroll({
        left: maxScrollLeft,
        behavior: 'smooth',
      })
    }
  }

  const move = useCallback(
    (tab: ITab, info: { swiped: boolean }) => {
      props.onTabChange(tab.key, info)
      showActiveTab(tab)
    },
    [tabBarRef, activeTabIndex, props.onTabChange]
  )

  useEffect(() => {
    const $tabBar = tabBarRef.current
    const $tabBarIndicator = tabBarIndicatorRef.current
    const $tabMains = tabMainsRef.current

    if (!$tabBar || !$tabBarIndicator || !$tabMains) {
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
      $tabBar,
      $tabMains,
      $tabBarIndicator,
      useInlineButtons: Boolean(props.useInlineButtons),
    })

    const dispose = pipe(
      addEffect((state) => {
        if (state._t === 'swipe_started') {
          translate({
            dx: state.dx,
          })
          state.e.preventDefault()
        } else {
          resetTranslation()
        }
      }),
      addEffect((state) => {
        if (
          activeTabIndex !== state.activeTabIndex &&
          props.tabs[state.activeTabIndex]?.key
        ) {
          move(props.tabs[state.activeTabIndex], { swiped: true })
        }
      })
    )

    const onTouchStart = (e: TouchEvent) => {
      if (isSwipeDisabled) {
        dispatch({
          _t: 'TOUCH_END',
        })
      } else {
        dispatch({
          _t: 'TOUCH_START',
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        })
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (isSwipeDisabled) {
        dispatch({
          _t: 'TOUCH_END',
        })
      } else {
        dispatch({
          _t: 'TOUCH_MOVE',
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          e,
        })
      }
    }

    const onTouchEnd = () => {
      dispatch({
        _t: 'TOUCH_END',
      })
    }

    const capture = props.tabs[activeTabIndex]?.useCapture ?? false

    $tabMains.addEventListener('touchstart', onTouchStart, {
      passive: true,
      capture,
    })
    $tabMains.addEventListener('touchmove', onTouchMove, {
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

  useEffect(() => {
    const $tabBar = tabBarRef.current

    if (!$tabBar) {
      const interval = setInterval(() => {
        const $tabBar = tabBarRef.current

        if ($tabBar) {
          clearInterval(interval)
          setStyle($tabBar)
        }
      }, 64)

      return () => {
        clearInterval(interval)
      }
    }

    const setStyle = ($tabBar: HTMLDivElement) => {
      if (props.useInlineButtons) {
        const $tabBarItem = $tabBar.children[activeTabIndex + 1] as
          | HTMLDivElement
          | undefined

        if ($tabBarItem) {
          setTabBarIndicatorTransform(`
            translateX(${$tabBarItem.offsetLeft}px)
            scaleX(${$tabBarItem.clientWidth / $tabBar.clientWidth})
          `)
        }
      } else {
        setTabBarIndicatorTransform(`translateX(${activeTabIndex * 100}%)`)
      }
    }

    setStyle($tabBar)

    if (typeof window !== 'undefined') {
      const onResize = () => {
        setStyle($tabBar)
      }

      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
      }
    }
  }, [tabBarRef, activeTabIndex, props.useInlineButtons])

  const go = useCallback((tabKey: string) => {
    const activeTab = props.tabs.find((tab) => tab.key === tabKey)
    if (activeTab) {
      move(activeTab, { swiped: false })
    }
  }, [])

  const enableSwipe = useCallback(() => {
    setIsSwipeDisabled(false)
  }, [])

  const disableSwipe = useCallback(() => {
    setIsSwipeDisabled(true)
  }, [])

  return (
    <ContextTabsController.Provider
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
          [css.vars.tabBar.indicator.display]: mounted ? 'block' : 'none',
          [css.vars.tabBar.indicator.width]: props.useInlineButtons
            ? '100%'
            : 100 / tabCount + '%',
          [css.vars.tabBar.indicator.transform]: tabBarIndicatorTransform,
          [css.vars.tabMain.width]: tabCount * 100 + '%',
          [css.vars.tabMain.transform]:
            'translateX(' + -1 * activeTabIndex * (100 / tabCount) + '%)',
        })}
      >
        <div
          ref={tabBarRef}
          className={css.tabBar({
            inline: props.useInlineButtons,
          })}
        >
          <div ref={tabBarIndicatorRef} className={css.tabBarIndicator} />
          {props.tabs.map((tab) => (
            <a
              key={tab.key}
              role="tab"
              aria-label={
                'buttonAriaLabel' in tab ? tab.buttonAriaLabel : tab.buttonLabel
              }
              className={css.tabBarItem({
                active: props.activeTabKey === tab.key ? true : undefined,
                inline: props.useInlineButtons,
              })}
              onClick={() => move(tab, { swiped: false })}
            >
              {tab.buttonLabel}
            </a>
          ))}
        </div>
        <div ref={tabMainsRef} className={css.tabMains}>
          {props.tabs.map(({ key, render }) => (
            <div
              key={key}
              className={css.tabMain({
                active: props.activeTabKey === key ? true : undefined,
              })}
            >
              {lazyMap[key] && render()}
            </div>
          ))}
        </div>
      </div>
    </ContextTabsController.Provider>
  )
}

function useMounted() {
  const [mounted, mount] = useReducer(() => true, false)
  useEffect(() => mount(), [mount])

  return mounted
}

export default Tabs

import React, { createRef, Children, ReactElement, isValidElement } from 'react'
import styled from '@emotion/styled'
import { Location, HashHistory, Update } from 'history'
import { keyframes, css } from '@emotion/core'

import PageRoute from '../PageRoute'
import { SwipeHandlers, OnSwipeBackParams } from './swipeHandler'
import { matchPath } from '../../utils/matchPath'
import { Match, RouteContext } from '../../context/route'
import { SwiperContext } from '../../context/swiper'

interface LocationHistoryState {
  location: Location
  willHide?: boolean
  alreadyHide?: boolean
  willRemovePrevChild?: boolean
}

interface State {
  width: number
  height: number
  locationHistories: LocationHistoryState[]
  activeIndex: number
  isSwiping: boolean
}

export interface SwiperProps {
  history: HashHistory
  children: ReactElement | ReactElement[]
  onLastPagePop?: () => void
  disabled?: boolean
}

const ANIMTATION_DURATION_MS = 350

const getMatchChildren = (
  children: ReactElement[],
  currentPath: string
): null | {
  match: Match<any>
  child: ReactElement
} => {
  for (const child of children) {
    const isPageRouteComp =
      child.type?.hasOwnProperty('displayName') && (child.type as any).displayName === PageRoute.displayName

    if (isValidElement(child) && isPageRouteComp) {
      if (!(child as ReactElement).props?.path) {
        return {
          match: {
            path: currentPath,
            url: currentPath,
            params: {},
            isExact: false,
          },
          child,
        }
      }

      const match = matchPath(currentPath, child.props as any)

      if (match) {
        return { match, child }
      }
    }
  }
  return null
}

export default class PageProvider extends React.Component<SwiperProps, State> {
  historySubscription: null | (() => void) = null
  wrapperEl = createRef<HTMLDivElement>()
  swipeHandlerInstance: SwipeHandlers | null = null

  constructor(props: SwiperProps) {
    super(props)

    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      locationHistories: [{ location: props.history.location, willHide: false }],
      activeIndex: 0,
      isSwiping: false,
    }
  }

  componentDidMount() {
    const { history, disabled, onLastPagePop } = this.props
    this.swipeHandlerInstance = new SwipeHandlers({
      onResize: this.setState.bind(this),
      onAfterSwipe: this.onAfterSwipe,
      onSwiping: this.onSwiping,
      onSwipeLastPage: onLastPagePop,
      animationDuration: ANIMTATION_DURATION_MS,
      disabled,
      container: this.wrapperEl!.current as HTMLDivElement,
    })
    this.swipeHandlerInstance.init()

    this.historySubscription = history.listen(this.onChangeLocation)

    document.body.style.overflow = 'hidden'
  }

  componentDidUpdate(prevProps: Readonly<SwiperProps>) {
    const { disabled } = this.props
    disabled && disabled !== prevProps.disabled && this.setDisabled(disabled)
  }

  onChangeLocation = ({ action, location }: Update) => {
    const { locationHistories, activeIndex } = this.state
    const historyLength = locationHistories.length - 1

    switch (action) {
      case 'PUSH': {
        return this.setState({
          locationHistories: [...locationHistories, { location, willHide: false }],
          activeIndex: activeIndex + 1,
        })
      }
      case 'POP': {
        const matchedLocationFromHistory = locationHistories.findIndex((d) => d.location.key === location.key)
        const nextActiveIndex = matchedLocationFromHistory < 0 ? activeIndex - 1 : matchedLocationFromHistory

        const nextLocationHistories = locationHistories
          .map((loc, idx) => {
            return loc.alreadyHide ? null : nextActiveIndex < idx ? { ...loc, willHide: true } : loc
          })
          .filter((d) => d !== null) as State['locationHistories']

        const nextLocationHistoriesLength = nextLocationHistories.length - 1

        if (nextLocationHistoriesLength === historyLength) {
          this.setDuringAnimation(true)
        }

        return this.setState({
          locationHistories: nextLocationHistories,
          activeIndex: nextActiveIndex,
        })
      }
      case 'REPLACE': {
        const willAnimate = (location.state as any)?.renderAnimate

        return this.setState({
          locationHistories: willAnimate
            ? locationHistories.concat({ location, willRemovePrevChild: true })
            : locationHistories.map((loc, idx) => (idx < historyLength ? loc : { ...loc, location })),
        })
      }
    }
  }

  onSwiping = (isSwiping: boolean) => {
    const { isSwiping: prevIsSwiping } = this.state
    prevIsSwiping !== isSwiping && this.setState({ isSwiping })
  }

  onAfterSwipe = async ({ swipeBacked, isLast }: OnSwipeBackParams) => {
    if (swipeBacked && !isLast) {
      await this.setState(({ locationHistories, ...prevState }) => {
        const historyLength = locationHistories.length - 1

        return {
          ...prevState,
          locationHistories: locationHistories.map((loc, idx) =>
            idx < historyLength ? loc : { ...loc, alreadyHide: true }
          ),
        }
      })
      this.props.history.back()
    }
  }

  componentWillUnmount() {
    this.swipeHandlerInstance?.destroy()
    this.swipeHandlerInstance = null

    document.body.style.overflow = 'auto'
    this.historySubscription?.()
  }

  handlePopPage = (key: string) => {
    this.setState(
      ({ locationHistories, ...prevState }) => {
        const nextLocationHistories = locationHistories.filter(({ location }) => location.key !== key)
        return {
          ...prevState,
          locationHistories: nextLocationHistories,
        }
      },
      () => this.setDuringAnimation(false)
    )
  }

  setDisabled = (isDisabled: boolean) => {
    this.swipeHandlerInstance?.setDisable(isDisabled)
  }

  setDuringAnimation = (isDuringAnimation: boolean) => {
    this.swipeHandlerInstance?.setIsDuringAnimation(isDuringAnimation)
  }

  render() {
    const { children, onLastPagePop } = this.props
    const { height, width, locationHistories, activeIndex, isSwiping } = this.state

    const childrenArray = Children.toArray(children) as ReactElement[]
    const currentSlideLength = locationHistories.length - 1

    return (
      <SwiperContext.Provider
        value={{
          setDisable: this.setDisabled,
          onLastPagePop,
          disabled: this.swipeHandlerInstance?.isDisabled || false,
        }}>
        <Base ref={this.wrapperEl} height={height} width={width}>
          {locationHistories.map(({ willHide, location, willRemovePrevChild }, idx) => {
            const childrenWithMatch = getMatchChildren(childrenArray, location.pathname)

            return (
              <SlideWrapper key={idx} ignoreAnimation={!idx || idx >= currentSlideLength} isHide={activeIndex > idx}>
                <SlideOverlay willHide={willHide} key={`${willHide}`} />
                <Slide
                  willHide={willHide}
                  ignoreAnimation={!idx}
                  onAnimationEnd={
                    willHide
                      ? () => this.handlePopPage(location.key)
                      : () => {
                          const prevElement = locationHistories[idx - 1]
                          willRemovePrevChild && prevElement && this.handlePopPage(prevElement.location.key)
                          this.setDuringAnimation(false)
                        }
                  }>
                  {(() => {
                    if (childrenWithMatch) {
                      return (
                        <RouteContext.Provider
                          value={{
                            location,
                            isActive: activeIndex === idx,
                            match: childrenWithMatch.match,
                            currentIndex: idx,
                            scrollBlock: activeIndex !== idx || isSwiping,
                          }}>
                          {childrenWithMatch.child}
                        </RouteContext.Provider>
                      )
                    }
                    console.warn('There is no matched components', children)

                    return null
                  })()}
                </Slide>
              </SlideWrapper>
            )
          })}
        </Base>
      </SwiperContext.Provider>
    )
  }
}

const Base = styled.div<{ height: number; width: number }>`
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
`
const fullscreenAbsoluteStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
`
const SlideWrapper = styled.div<{ isHide: boolean; ignoreAnimation: boolean }>`
  ${fullscreenAbsoluteStyle};
  overflow: hidden;
  transform: ${({ isHide }) => (isHide ? 'translate3d(-10%, 0, 0)' : 'translate3d(0, 0, 0)')};
  transition: transform ${ANIMTATION_DURATION_MS}ms ease;
`
const SlideOverlay = styled.div<{ willHide?: boolean }>`
  ${fullscreenAbsoluteStyle};
  background-color: rgba(0, 0, 0, 0.7);
  @keyframes fadeIn {
    from {
      background-color: rgba(0, 0, 0, 0);
    }
    to {
      background-color: rgba(0, 0, 0, 0.7);
    }
  }
  @keyframes fadeOut {
    from {
      background-color: rgba(0, 0, 0, 0.7);
    }
    to {
      background-color: rgba(0, 0, 0, 0);
    }
  }
  animation: ${ANIMTATION_DURATION_MS}ms ${({ willHide }) => (willHide ? 'fadeOut' : 'fadeIn')} ease-in-out;
`
const slideFromRight = keyframes`
  from {
    transform: translate3d(100%, 0, 0);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
`
const slideFromLeft = keyframes`
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(100%, 0, 0);
  }
`
const Slide = styled.div<{
  ignoreAnimation: boolean
  willHide?: boolean
}>`
  position: relative;
  height: 100%;
  background: #fff;
  overflow: hidden;
  ${({ ignoreAnimation, willHide }) =>
    !ignoreAnimation &&
    (willHide
      ? css`
          animation: ${ANIMTATION_DURATION_MS}ms ${slideFromLeft} ease;
        `
      : css`
          animation: ${ANIMTATION_DURATION_MS}ms ${slideFromRight} ease-in-out;
        `)}
`

import { Subscription, fromEvent, merge, partition, of } from 'rxjs'
import { throttleTime, tap, filter, map, switchMap, take, ignoreElements } from 'rxjs/operators'

export interface ScreenSize {
  width: number
  height: number
}
export interface OnSwipeBackParams {
  swipeBacked: boolean
  isLast: boolean
}
interface SwipeOptionValues {
  disabled?: boolean
  animationDuration?: number
  container: HTMLDivElement
}
interface SwipeOptionFunctions {
  onSwiping?: (isSwiping: boolean) => void
  onResize?: (screenSize: ScreenSize) => void
  onAfterSwipe: (options: OnSwipeBackParams) => Promise<void>
  onSwipeLastPage?: () => void
}

type SwipeOptions = SwipeOptionValues & SwipeOptionFunctions
type RequiredSwipeOptions = Required<SwipeOptionValues> & SwipeOptionFunctions

const DEFAULT_OPTIONS = {
  disabled: false,
  animationDuration: 350,
}

const getMouseStartEventObservable = (container: HTMLDivElement, isEnabled: () => boolean) =>
  merge(
    fromEvent<MouseEvent>(container, 'mousedown').pipe(
      tap((e) => e.preventDefault()),
      filter(isEnabled),
      map((event) => ({ event, isMouseEvent: true }))
    ),
    fromEvent<TouchEvent>(container, 'touchstart').pipe(
      filter(isEnabled),
      map((e) => ({ event: e.touches[0], isMouseEvent: false }))
    )
  )

export class SwipeHandlers {
  private options: Omit<RequiredSwipeOptions, 'container'>
  private screenSize: ScreenSize = { width: 0, height: 0 }
  private thresholdStart = 0
  private delta = { x: 0, y: 0 }
  private isDuringAnimation = false

  private touchStartSubscription: null | Subscription = null
  private resizeSubscription: null | Subscription = null
  private mouseMoveAnimationFrame?: number | null
  private mouseUpAnimationFrame?: number | null
  private container: HTMLDivElement

  constructor({ container, ...options }: SwipeOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.setThresholdAndScreenSize()
    this.container = container
  }
  private subscribeResize() {
    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(throttleTime(30))
      .subscribe(() => {
        this.options.onResize?.(this.setThresholdAndScreenSize())
      })
  }
  private clearResizeSubscription() {
    this.resizeSubscription && this.resizeSubscription.unsubscribe()
    this.resizeSubscription = null
  }
  private getCurrentElement(): {
    element?: HTMLDivElement
    prevElement?: HTMLDivElement
    currentChildrenIndex: number
  } {
    const wrapperEl = this.container
    const currentChildrenIndex = wrapperEl ? wrapperEl.childElementCount - 1 : 0

    return {
      element: wrapperEl?.children?.[currentChildrenIndex] as HTMLDivElement,
      prevElement: wrapperEl?.children?.[currentChildrenIndex - 1] as HTMLDivElement,
      currentChildrenIndex,
    }
  }
  private subscribeSwipe() {
    this.setIsDuringAnimation(false)

    this.touchStartSubscription = getMouseStartEventObservable(this.container, () => !this.options.disabled)
      .pipe(
        filter(() => !this.isDuringAnimation && !this.options.disabled),
        map(({ event, ...args }) => ({
          ...args,
          x: event.pageX,
          y: event.pageY,
        })),
        filter(({ x }) => x <= this.thresholdStart),
        switchMap(({ isMouseEvent, x: startX, y: startY }) => {
          const startedAt = Date.now()
          const width = this.screenSize.width

          const { element, prevElement } = this.getCurrentElement()

          const isLast = !prevElement
          const overlayChild = element?.firstChild as HTMLDivElement | undefined
          const child = element?.children[1] as HTMLDivElement | undefined

          let isMoveEventAttached = false

          const [mouse$, touch$] = partition(of(isMouseEvent), (d) => d)

          return merge(
            merge(
              mouse$.pipe(switchMap(() => fromEvent<MouseEvent>(this.container, 'mousemove'))),
              touch$.pipe(
                switchMap(() =>
                  fromEvent<TouchEvent>(this.container, 'touchmove').pipe(map((event) => event.touches[0]))
                )
              )
            ).pipe(
              map((event) => {
                const x = event.pageX
                const y = event.pageY
                return {
                  x,
                  y,
                  delta: {
                    x: Math.max(x - startX, 0),
                    y: Math.max(y - startY, 0),
                  },
                }
              }),
              // check is scrolling
              filter(({ delta }) => !(Math.abs(delta.x) < Math.abs(delta.y))),
              // mouse move animation
              tap(({ delta: { x }, delta }) => {
                this.delta = delta
                this.options.onSwiping?.(true)

                isMoveEventAttached = true

                this.mouseMoveAnimationFrame = requestAnimationFrame(() => {
                  if (overlayChild && child) {
                    if (!prevElement) {
                      const newX = x / 4
                      child.style.cssText = `transform: translate3d(${newX}px, 0, 0);`
                      overlayChild.style.cssText = `
                        background-color: rgba(0, 0, 0, ${Math.min(0.7, ((width - newX) / width) * 0.7)});
                        transition: none;
                      `
                    } else {
                      const swipedPercentage = (width - x) / width
                      overlayChild.style.cssText = `
                        background-color: rgba(0, 0, 0, ${Math.min(0.7, swipedPercentage * 0.7)});
                        transition: none
                      `
                      child.style.cssText = `transform: translate3d(${x}px, 0, 0);`

                      prevElement.style.cssText = `
                        transform: translate3d(-${swipedPercentage * 10}%, 0, 0);
                        transition: none;
                      `
                    }
                  }
                })
              }),
              ignoreElements()
            ),
            merge(
              fromEvent<MouseEvent>(this.container, 'mouseup'),
              fromEvent<MouseEvent>(this.container, 'mouseleave'),
              fromEvent<TouchEvent>(this.container, 'touchend')
            ).pipe(
              tap(() => {
                if (!isMoveEventAttached) {
                  return
                }
                const animationDuration = this.options.animationDuration
                this.setIsDuringAnimation(true)
                const { x } = this.delta

                this.mouseUpAnimationFrame = requestAnimationFrame(() => {
                  if (overlayChild && child) {
                    const velocity = x / (Date.now() - startedAt)
                    const willSwipeBack = velocity > 0.8 || x > width * 0.4

                    child.ontransitionend = () => {
                      try {
                        this.options
                          .onAfterSwipe({
                            swipeBacked: willSwipeBack,
                            isLast,
                          })
                          .catch(() => null)

                        this.setIsDuringAnimation(false)
                        this.options.onSwiping?.(false)
                        this.delta = { x: 0, y: 0 }

                        if (prevElement) {
                          prevElement.style.cssText = ''
                        }
                      } catch {}
                    }
                    if (prevElement) {
                      prevElement.ontransitionend = () => {
                        prevElement.style.cssText = ''
                      }
                    }

                    if (willSwipeBack && !isLast) {
                      child.style.cssText = `
                          transition: transform ${animationDuration}ms ease;
                          transform: translate(100%, 0);
                        `
                      overlayChild.style.cssText = `
                          transition: background-color ${animationDuration}ms ease;
                          background-color: rgba(0, 0, 0, 0);
                        `

                      if (prevElement) {
                        prevElement.style.cssText = `
                            transition: transform ${animationDuration}ms ease;
                            transform: translate3d(0, 0, 0);
                          `
                      }
                    } else {
                      child.style.cssText = `
                          transition: transform ${animationDuration}ms ease;
                          transform: translate(0, 0);
                        `
                      overlayChild.style.cssText = `
                          transition: background-color ${animationDuration}ms ease;
                          background-color: rgba(0, 0, 0, 0.7);
                        `

                      if (prevElement) {
                        prevElement.style.cssText = `
                            transition: transform ${animationDuration}ms ease;
                            transform: translate3d(-10%, 0, 0);
                          `
                      }
                    }
                    if (willSwipeBack && isLast) {
                      return this.options.onSwipeLastPage?.()
                    }
                  }
                })
              })
            )
          ).pipe(take(1))
        })
      )
      .subscribe()
  }
  private clearSwipeSubscription() {
    this.touchStartSubscription?.unsubscribe()
    this.touchStartSubscription = null
  }

  public init() {
    this.subscribeResize()
    this.subscribeSwipe()
  }
  public destroy() {
    this.clearResizeSubscription()
    this.clearSwipeSubscription()

    typeof this.mouseMoveAnimationFrame === 'number' && cancelAnimationFrame(this.mouseMoveAnimationFrame)
    this.mouseMoveAnimationFrame = null
    typeof this.mouseUpAnimationFrame === 'number' && cancelAnimationFrame(this.mouseUpAnimationFrame)
    this.mouseUpAnimationFrame = null
  }
  public setDisable(isDisabled: boolean) {
    this.options.disabled = isDisabled
  }
  public get isDisabled() {
    return this.options.disabled
  }
  public setIsDuringAnimation(isDuringAnimation: boolean) {
    this.isDuringAnimation = isDuringAnimation
  }

  public setThresholdAndScreenSize(): ScreenSize {
    const width = window.innerWidth
    const screenSize = { width, height: window.innerHeight }

    this.thresholdStart = 0.15 * width
    this.screenSize = screenSize

    return screenSize
  }
}

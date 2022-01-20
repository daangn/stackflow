import React, { createContext, useContext, useMemo, useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import Navigator from '../Navigator'
import Screen from '../Screen'

import { useNavigator } from '../useNavigator'

import type {
  BeforePushType,
  KarrotframePlugin,
  PluginType,
} from '@karrotframe/plugins'
import { composeMiddlewares } from '@karrotframe/plugins'

const Page404: React.FC = () => <div>Not Found</div>

test('인터페이스에 맞게 플러그인을 선언하면 정상적으로 렌더링한다.', () => {
  // given
  const SimplePluginContext = createContext<{
    data: any
    setData: (data: any) => void
  }>(null as any)
  const SimplePluginProvider: React.FC = (props) => {
    const [data, setData] = useState<any>('hello plugin!')
    return (
      <SimplePluginContext.Provider value={{ data, setData }}>
        {props.children}
      </SimplePluginContext.Provider>
    )
  }
  const useSimplePlugin = (): PluginType & { sampleFunction: () => string } => {
    const context = useContext(SimplePluginContext)
    return useMemo(() => {
      return {
        lifeCycleHooks: {
          beforePush: async ({ to }) => {
            context.setData(to)
          },
        },
        sampleFunction: () => context?.data,
      }
    }, [context])
  }

  const SamplePage: React.FC = () => {
    const { sampleFunction } = useSimplePlugin()
    return <div>{sampleFunction() || 'no data'}</div>
  }

  const simplePlugin: KarrotframePlugin = {
    name: 'simple-plugin',
    provider: SimplePluginProvider,
    executor: useSimplePlugin,
  }

  // when
  render(
    <Navigator plugins={[simplePlugin]}>
      <Screen path="/" component={SamplePage} />
    </Navigator>
  )

  // then
  const hello = screen.getByText('hello plugin!')
  expect(hello).toBeVisible()
})

test('플러그인의 hook 에서 얻은 정보로 컴포넌트를 업데이트한다.', async () => {
  // given
  const SimplePluginContext = createContext<{
    data: any
    setData: (data: any) => void
  }>(null as any)
  const SimplePluginProvider: React.FC = (props) => {
    const [data, setData] = useState<any>('hello plugin!')
    return (
      <SimplePluginContext.Provider value={{ data, setData }}>
        {props.children}
      </SimplePluginContext.Provider>
    )
  }
  const useSimplePlugin = (): PluginType & {
    displayCurrentPath: () => string
  } => {
    const context = useContext(SimplePluginContext)
    return useMemo(() => {
      return {
        lifeCycleHooks: {
          beforePush: async ({ to }) => {
            context.setData(to)
          },
        },
        displayCurrentPath: () => context?.data,
      }
    }, [context])
  }

  const simplePlugin: KarrotframePlugin = {
    name: 'simple-plugin',
    provider: SimplePluginProvider,
    executor: useSimplePlugin,
  }

  const MainPage: React.FC = () => {
    const { push } = useNavigator()
    return (
      <div>
        <ul>
          <li>
            <a
              onClick={(event) => {
                event.preventDefault()
                push('/target-page')
              }}
            >
              Move Page
            </a>
          </li>
        </ul>
      </div>
    )
  }

  const TargetPage: React.FC = () => {
    const { displayCurrentPath } = useSimplePlugin()
    const { push } = useNavigator()
    return (
      <div
        onClick={() => {
          push('/')
        }}
      >
        {displayCurrentPath() || 'no path'}
      </div>
    )
  }

  render(
    <Navigator plugins={[simplePlugin]}>
      <Screen path="/" component={MainPage} />
      <Screen path="/target-page" component={TargetPage} />
    </Navigator>
  )

  try {
    // when
    const movePageButton = await screen.findByText('Move Page')
    fireEvent.click(movePageButton)

    // then
    const currentPath = await screen.findByText('/target-page')
    expect(currentPath).toBeVisible()
  } finally {
    // teardown
    const teardownButton = await screen.findByText('/target-page')
    fireEvent.click(teardownButton)
    const initialPage = await screen.findByText('Move Page')
    expect(initialPage).toBeVisible()
  }
})

test('플러그인을 사용해서 미들웨어의 마지막 단에 가공한 url 로 이동한다.', async () => {
  // given
  const modifyUrlMiddleware = async (
    ctx: BeforePushType,
    next: (ctx?: BeforePushType) => Promise<BeforePushType | void>
  ): Promise<BeforePushType | void> => {
    if (ctx.to === '/false-url') {
      await next({
        ...ctx,
        to: '/correct-url',
      })
    }
  }
  const loggerMiddleware = async (
    ctx: BeforePushType,
    next: (ctx?: BeforePushType) => Promise<BeforePushType | void>
  ): Promise<BeforePushType | void> => {
    console.log('logger : ', ctx.to)
    next(ctx)
  }
  const redirectMiddleware = async (
    ctx: BeforePushType
  ): Promise<BeforePushType | void> => {
    ctx.options.push?.(ctx.to)
  }

  const useTestMiddlewarePlugin = (): PluginType => ({
    lifeCycleHooks: {
      beforePush: composeMiddlewares<BeforePushType>([
        modifyUrlMiddleware,
        loggerMiddleware,
        redirectMiddleware,
      ]),
    },
  })

  const middlewarePlugin: KarrotframePlugin = {
    name: 'middleware-plugin',
    executor: useTestMiddlewarePlugin,
  }

  const FalsePage: React.FC = () => <div>false</div>
  const CorrectPage: React.FC = () => {
    const { push } = useNavigator()
    return (
      <div
        onClick={() => {
          push('/')
        }}
      >
        correct
      </div>
    )
  }
  const Main: React.FC = () => {
    const { push } = useNavigator()
    return (
      <div>
        <ul>
          <li>
            <a
              onClick={(event) => {
                event.preventDefault()
                push('/false-url')
              }}
            >
              Move Page
            </a>
          </li>
        </ul>
      </div>
    )
  }

  render(
    <Navigator plugins={[middlewarePlugin]}>
      <Screen path="/" component={Main} />
      <Screen path="/false-url" component={FalsePage} />
      <Screen path="/correct-url" component={CorrectPage} />
      <Screen path="*" component={Page404} />
    </Navigator>
  )

  try {
    // when
    const movePage = await screen.findByText('Move Page')
    fireEvent.click(movePage)

    // then
    const result = await screen.findByText('correct')
    expect(result).toBeVisible()
  } finally {
    // teardown
    const teardownButton = await screen.findByText('correct')
    fireEvent.click(teardownButton)
    const isMainPage = await screen.findByText('Move Page')
    expect(isMainPage).toBeVisible()
  }
})

test('2개 이상의 플러그인을 조합해서 사용할 수 있다.', async () => {
  const SimplePluginContext = createContext<{
    data: any
    setData: (data: any) => void
  }>(null as any)
  const SimplePluginProvider: React.FC = (props) => {
    const [data, setData] = useState<any>('hello plugin!')
    return (
      <SimplePluginContext.Provider value={{ data, setData }}>
        {props.children}
      </SimplePluginContext.Provider>
    )
  }
  const useSimplePlugin = (): PluginType & {
    displayCurrentPath: () => string
  } => {
    const context = useContext(SimplePluginContext)
    return useMemo(() => {
      return {
        lifeCycleHooks: {
          beforePush: async ({ to }) => {
            context.setData(to)
          },
        },
        displayCurrentPath: () => context?.data,
      }
    }, [context])
  }

  const simplePlugin: KarrotframePlugin = {
    name: 'simple-plugin',
    provider: SimplePluginProvider,
    executor: useSimplePlugin,
  }

  const modifyUrlMiddleware = async (
    ctx: BeforePushType,
    next: (ctx?: BeforePushType) => Promise<BeforePushType | void>
  ): Promise<BeforePushType | void> => {
    if (ctx.to === '/false-url') {
      await next({
        ...ctx,
        to: '/correct-url',
      })
    }
  }
  const loggerMiddleware = async (
    ctx: BeforePushType,
    next: (ctx?: BeforePushType) => Promise<BeforePushType | void>
  ): Promise<BeforePushType | void> => {
    console.log('logger : ', ctx.to)
    next(ctx)
  }
  const redirectMiddleware = async (
    ctx: BeforePushType
  ): Promise<BeforePushType | void> => {
    ctx.options.push?.(ctx.to)
  }

  const useTestMiddlewarePlugin = (): PluginType => ({
    lifeCycleHooks: {
      beforePush: composeMiddlewares<BeforePushType>([
        modifyUrlMiddleware,
        loggerMiddleware,
        redirectMiddleware,
      ]),
    },
  })

  const middlewarePlugin: KarrotframePlugin = {
    name: 'middleware-plugin',
    executor: useTestMiddlewarePlugin,
  }

  const FalsePage: React.FC = () => <div>false</div>
  const CorrectPage: React.FC = () => {
    const { displayCurrentPath } = useSimplePlugin()
    const { push } = useNavigator()
    return (
      <div
        onClick={() => {
          push('/')
        }}
      >
        {displayCurrentPath()}
      </div>
    )
  }
  const Main: React.FC = () => {
    const { push } = useNavigator()
    return (
      <div>
        <ul>
          <li>
            <a
              onClick={(event) => {
                event.preventDefault()
                push('/false-url')
              }}
            >
              Move Page
            </a>
          </li>
        </ul>
      </div>
    )
  }

  render(
    <Navigator plugins={[simplePlugin, middlewarePlugin]}>
      <Screen path="/" component={Main} />
      <Screen path="/false-url" component={FalsePage} />
      <Screen path="/correct-url" component={CorrectPage} />
      <Screen path="*" component={Page404} />
    </Navigator>
  )

  try {
    // when
    const movePage = await screen.findByText('Move Page')
    fireEvent.click(movePage)

    // then
    const result = await screen.findByText('/correct-url')
    expect(result).toBeVisible()
  } finally {
    // teardown
    const teardownButton = await screen.findByText('/correct-url')
    fireEvent.click(teardownButton)
    const initialPage = await screen.findByText('Move Page')
    expect(initialPage).toBeVisible()
  }
})

test('플러그인을 2개 이상 사용할 때 플러그인을 배열에 선언한 순서에 따라 플러그인이 작동한다.', async () => {
  // given
  const redirectFirst = async (
    ctx: BeforePushType
  ): Promise<BeforePushType | void> => {
    if (ctx.to === '/move') {
      ctx.options.push?.('/first-url')
    }
  }
  const redirectSecond = async (
    ctx: BeforePushType
  ): Promise<BeforePushType | void> => {
    if (ctx.to === '/first-url') {
      ctx.options.push?.('/second-url')
    }
  }
  const useFirstPlugin = (): PluginType => ({
    lifeCycleHooks: {
      beforePush: redirectFirst,
    },
  })
  const firstPlugin: KarrotframePlugin = {
    name: 'first-plugin',
    executor: useFirstPlugin,
  }

  const useSecondPlugin = (): PluginType => ({
    lifeCycleHooks: {
      beforePush: redirectSecond,
    },
  })
  const secondPlugin: KarrotframePlugin = {
    name: 'second-plugin',
    executor: useSecondPlugin,
  }

  const MainPage: React.FC = () => {
    const { push } = useNavigator()
    return (
      <div
        onClick={() => {
          push('/move')
        }}
      >
        move page
      </div>
    )
  }
  const FirstPage: React.FC = () => <div>first</div>
  const SecondPage: React.FC = () => {
    const { push } = useNavigator()
    return (
      <div
        onClick={() => {
          push('/')
        }}
      >
        second
      </div>
    )
  }

  // when
  render(
    <Navigator plugins={[firstPlugin, secondPlugin]}>
      <Screen path="/" component={MainPage} />
      <Screen path="/move" component={MainPage} />
      <Screen path="/first-url" component={FirstPage} />
      <Screen path="/second-url" component={SecondPage} />
    </Navigator>
  )

  try {
    const movePageButton = await screen.findByText('move page')
    fireEvent.click(movePageButton)

    // then
    const result = await screen.findByText('second')
    expect(result).toBeVisible()
  } finally {
    // teardown
    const teardownButton = await screen.findByText('second')
    fireEvent.click(teardownButton)
    const isMainPage = await screen.findByText('move page')
    expect(isMainPage).toBeVisible()
  }
})

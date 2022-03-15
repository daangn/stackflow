import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import Navigator from '../Navigator'
import Screen from '../Screen'

import { useNavigator } from '../useNavigator'

const NOOP = () => {}

test('Navigator 에 선언한 path 로 push 하면 해당 Screen 의 component 를 렌더링한다.', async () => {
  // given
  const MainPage: React.FC = () => {
    const { push } = useNavigator()
    return (
      <div>
        <button
          onClick={() => {
            push('/target-page')
          }}
        >
          move page
        </button>
      </div>
    )
  }

  const TargetPage: React.FC = () => {
    const { push } = useNavigator()
    return (
      <div
        onClick={() => {
          push('/')
        }}
      >
        This is target page
      </div>
    )
  }

  render(
    <Navigator onClose={NOOP}>
      <Screen path="/" component={MainPage} />
      <Screen path="/target-page" component={TargetPage} />
    </Navigator>
  )

  try {
    // when
    const moveButton = await screen.findByText('move page')
    fireEvent.click(moveButton)

    // then
    const targetPage = await screen.findByText(/this is target page/i)
    expect(targetPage).toBeVisible()
  } finally {
    // teardown
    const teardownPage = await screen.findByText(/this is target page/i)
    fireEvent.click(teardownPage)
    const pageForTeardown = await screen.findByText('move page')
    expect(pageForTeardown).toBeVisible()
  }
})

test('Navigator 에 path 를 지정하지 않은 path 를 push 로 이동한 경우에는 * 로 지정한 컴포넌트로 이동한다', async () => {
  // given
  const MainPage: React.FC = () => {
    const { push } = useNavigator()
    return (
      <div>
        <button
          onClick={() => {
            push('/non-existent-path')
          }}
        >
          move page
        </button>
      </div>
    )
  }

  const Page404: React.FC = () => {
    const { push } = useNavigator()

    return (
      <div
        onClick={() => {
          push('/')
        }}
      >
        Not Found
      </div>
    )
  }

  render(
    <Navigator onClose={NOOP}>
      <Screen path="/" component={MainPage} />
      <Screen path="/*" component={Page404} />
    </Navigator>
  )

  try {
    // when
    const moveButton = await screen.findByText('move page')
    fireEvent.click(moveButton)

    // then
    const notFoundPage = await screen.findByText(/not found/i)
    expect(notFoundPage).toBeVisible()
  } finally {
    // teardown
    const teardownButton = await screen.findByText(/not found/i)
    fireEvent.click(teardownButton)
    const pageForTeardown = await screen.findByText('move page')
    expect(pageForTeardown).toBeVisible()
  }
})

test('push 후 pop 을 사용하면 이전 페이지로 이동한다.', async () => {
  const MainPage: React.FC = () => {
    const { push } = useNavigator()
    return (
      <div>
        <button
          onClick={() => {
            push('/target-page')
          }}
        >
          move page
        </button>
        <button
          onClick={() => {
            push('/')
          }}
        >
          teardown
        </button>
      </div>
    )
  }

  const TargetPage: React.FC = () => {
    const { pop } = useNavigator()
    return (
      <div
        onClick={() => {
          pop()
        }}
      >
        This is target page
      </div>
    )
  }

  render(
    <Navigator onClose={NOOP}>
      <Screen path="/" component={MainPage} />
      <Screen path="/target-page" component={TargetPage} />
    </Navigator>
  )

  try {
    // when
    const moveButton = await screen.findByText('move page')
    fireEvent.click(moveButton)

    // then
    const targetPage = await screen.findByText(/this is target page/i)
    expect(targetPage).toBeVisible()

    // when
    fireEvent.click(targetPage)

    // then
    const beforePage = await screen.findByText('move page')
    expect(beforePage).toBeVisible()
  } finally {
    // teardown
    const teardownButton = await screen.findByText('teardown')
    fireEvent.click(teardownButton)

    const teardownPage = await screen.findByText('move page')
    expect(teardownPage).toBeVisible()
  }
})

test('send data 후 pop 을 사용하면 데이터를 이전 페이지에서 확인할 수 있다.', async () => {
  // given
  const MainPage: React.FC = () => {
    const { push } = useNavigator()
    const [path, setPath] = useState<string>('')
    return (
      <div>
        <button
          onClick={async () => {
            const data = await push<string>('/target-page')
            setPath(data || '')
          }}
        >
          {path || 'move page'}
        </button>
        <button
          onClick={() => {
            push('/')
          }}
        >
          teardown
        </button>
      </div>
    )
  }

  const mockSend = jest.fn()

  const TargetPage: React.FC = () => {
    const { pop } = useNavigator()
    return (
      <div
        onClick={() => {
          mockSend()
          pop().send('data from pop')
        }}
      >
        This is target page
      </div>
    )
  }

  render(
    <Navigator onClose={NOOP}>
      <Screen path="/" component={MainPage} />
      <Screen path="/target-page" component={TargetPage} />
    </Navigator>
  )

  try {
    const moveButton = await screen.findByText('move page')
    fireEvent.click(moveButton)

    const targetPage = await screen.findByText(/this is target page/i)
    expect(targetPage).toBeVisible()

    // when
    fireEvent.click(targetPage)

    // then
    expect(mockSend).toBeCalled()
    const beforePage = await screen.findByText('data from pop')
    expect(beforePage).toBeVisible()
  } finally {
    // teardown
    const teardownButton = await screen.findByText('teardown')
    fireEvent.click(teardownButton)

    const teardownPage = await screen.findByText('move page')
    expect(teardownPage).toBeVisible()
  }
})

import React from 'react'
import type { FC, ReactElement } from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'

import ScreenHelmet from '../ScreenHelmet'
import Navigator from '../Navigator'
import Screen from '../Screen'
import { useNavigator } from '../useNavigator'

describe('ScreenHelmet - visible: ', () => {
  const renderScreenHelmet = ({
    visible,
  }: {
    visible: boolean
  }): RenderResult => {
    const Example: FC = (): ReactElement => {
      return (
        <div>
          <ScreenHelmet visible={visible} />
          <span>example</span>
        </div>
      )
    }

    return render(
      <Navigator>
        <Screen path="/" component={Example} />
      </Navigator>
    )
  }

  it('visible: false 이면 navbar 가 나타나지 않는다', () => {
    const { queryByTestId } = renderScreenHelmet({ visible: false })
    const navBar = queryByTestId('navbar')
    expect(navBar).not.toBeInTheDocument()
  })

  it('visible: true 이면 navbar 가 나타난다', () => {
    const { getByTestId } = renderScreenHelmet({ visible: true })
    const navBar = getByTestId('navbar')
    expect(navBar).toBeVisible()
  })
})

describe('ScreenHelmet - preventSwipeBack:  ', () => {
  const renderScreenHelmet = ({
    preventSwipeBack,
  }: {
    preventSwipeBack: boolean
  }): RenderResult => {
    const Example: FC = (): ReactElement => {
      const { push } = useNavigator()

      return (
        <div>
          <ScreenHelmet preventSwipeBack={preventSwipeBack} />
          <span>example</span>
          <button
            onClick={() => {
              push('/another')
            }}
          >
            move
          </button>
        </div>
      )
    }
    const Another: FC = (): ReactElement => {
      const { push } = useNavigator()

      return (
        <div>
          <ScreenHelmet preventSwipeBack={preventSwipeBack} />
          <span>another</span>
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

    return render(
      <Navigator theme="Cupertino">
        <Screen path="/" component={Example} />
        <Screen path="/another" component={Another} />
      </Navigator>
    )
  }

  afterEach(async () => {
    try {
      await waitFor(() => {
        const teardownButton = screen.queryByText(/teardown/i)
        if (teardownButton) {
          fireEvent.click(teardownButton)
        }
      })
    } catch (e) {
      console.error(e)
    }
  })

  it('preventSwipeBack: true 이면 edge element 를 생성하지 않는다 ', async () => {
    // when
    const { getByText, queryByTestId } = renderScreenHelmet({
      preventSwipeBack: true,
    })
    const moveButton = getByText(/move/i)
    fireEvent.click(moveButton)

    // then
    await waitFor(() => {
      const edgeElement = queryByTestId('edge-element')
      expect(edgeElement).not.toBeInTheDocument()
    })
  })

  it('preventSwipeBack: false 이면 edge element 를 생성한다. ', async () => {
    // when
    const { getByText, findByTestId } = renderScreenHelmet({
      preventSwipeBack: false,
    })
    const moveButton = getByText(/move/i)
    fireEvent.click(moveButton)

    // then
    const edgeElement = await findByTestId('edge-element')
    expect(edgeElement).toBeInTheDocument()
  })
})

import React, { useEffect, useMemo } from 'react'

import { generateScreenId } from '../utils'
import {
  ScreenInstanceInfoProvider,
  ScreenInstanceOptionsProvider,
} from './contexts'
import { ScreenComponentProps } from './ScreenComponentProps'
import { NavbarOptions, Screen as IScreen, dispatch, action } from './store'

interface Props {
  /**
   * 해당 스크린의 URL Path
   */
  path: string

  /**
   * 해당 스크린에 표시할 컴포넌트
   */
  component: React.ComponentType<ScreenComponentProps>
}
const Screen: React.FC<Props> = (props) => {
  const PropsComponent = props.component

  const id = useMemo(() => generateScreenId(), [])

  useEffect(() => {
    const Component: IScreen['Component'] = ({
      screenInstanceId,
      isTop,
      isRoot,
      as,
    }) => {
      /**
       * ScreenContext를 통해 유저가 navbar를 바꿀때마다
       * 실제 ScreenInstance의 navbar를 변경
       */
      const setNavbar = (navbar: NavbarOptions) => {
        dispatch(action.SET_SCREEN_INSTANCE_OPTION, {
          screenInstanceId,
          screenInstanceOption: {
            navbar,
          },
        })
      }

      return (
        <ScreenInstanceInfoProvider
          value={{
            screenInstanceId,
            as,
            path: props.path,
          }}
        >
          <ScreenInstanceOptionsProvider
            value={{
              setNavbar,
            }}
          >
            <PropsComponent isTop={isTop} isRoot={isRoot} />
          </ScreenInstanceOptionsProvider>
        </ScreenInstanceInfoProvider>
      )
    }

    dispatch(action.SET_SCREEN, {
      screen: {
        id,
        path: props.path,
        Component,
      },
    })

    return () => {}
  }, [])

  return null
}

export default Screen

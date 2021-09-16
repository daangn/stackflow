import React from 'react'

import { INavigatorTheme } from '../types'
import * as css from './Card.css'

interface ICardFallbackProps {
  theme: INavigatorTheme
  nodeRef: React.RefObject<HTMLDivElement>
  isRoot: boolean
  isPresent: boolean
}
const CardFallback: React.FC<ICardFallbackProps> = (props) => {
  const android = props.theme === 'Android'
  const cupertino = props.theme === 'Cupertino'

  return (
    <div ref={props.nodeRef} className={css.container}>
      {!props.isRoot && (
        <div
          className={css.dim({
            android: android ? true : undefined,
            cupertinoAndIsNavbarVisible: false ? true : undefined,
            cupertinoAndIsPresent:
              cupertino && props.isPresent ? true : undefined,
          })}
        />
      )}
      <div className={css.mainOffset({})}>
        <div
          className={css.main({
            android: android ? true : undefined,
            androidAndIsRoot: android && props.isRoot ? true : undefined,
            cupertinoAndIsPresent:
              cupertino && props.isPresent ? true : undefined,
          })}
        >
          <div
            className={css.frameOffset({
              cupertinoAndIsNotPresent:
                cupertino && !props.isPresent ? true : undefined,
            })}
          >
            <div
              className={css.frame({
                cupertino: cupertino ? true : undefined,
                cupertinoAndIsNotRoot:
                  cupertino && !props.isRoot ? true : undefined,
                cupertinoAndIsPresent:
                  cupertino && props.isPresent ? true : undefined,
                cupertinoAndIsNotPresent:
                  cupertino && !props.isPresent ? true : undefined,
              })}
            >
              Loading...
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardFallback

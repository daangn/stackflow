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
            android,
            cupertinoAndIsNavbarVisible: false,
            cupertinoAndIsPresent: cupertino && props.isPresent,
          })}
        />
      )}
      <div
        className={css.mainOffset({
          androidAndIsNotTop: false,
        })}
      >
        <div
          className={css.main({
            android,
            androidAndIsRoot: android && props.isRoot,
            cupertinoAndIsPresent: cupertino && props.isPresent,
            androidAndIsNavbarVisible: false,
            cupertinoAndIsNavbarVisible: false,
          })}
        >
          <div
            className={css.frameOffset({
              cupertinoAndIsNotPresent: cupertino && !props.isPresent,
              cupertinoAndIsNotTop: false,
            })}
          >
            <div
              className={css.frame({
                cupertino,
                cupertinoAndIsNotRoot: cupertino && !props.isRoot,
                cupertinoAndIsPresent: cupertino && props.isPresent,
                cupertinoAndIsNotPresent: cupertino && !props.isPresent,
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

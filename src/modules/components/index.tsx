import React, { useMemo } from 'react'
import { HashHistory, createHashHistory } from 'history'

import Swiper, { SwiperProps } from './Swiper'
import { HistoryContext } from '../context/history'

type SwipeRouterProps = Omit<SwiperProps, 'history'> & {
  history?: HashHistory
}

let swiperOwnHistory: null | HashHistory

const SwipeRouter = ({ history, ...props }: SwipeRouterProps) => {
  const _history = useMemo(() => {
    if (!history) {
      if (!swiperOwnHistory) {
        swiperOwnHistory = createHashHistory()
      }
      return swiperOwnHistory
    }
    return history
  }, [])

  return (
    <HistoryContext.Provider value={_history}>
      <Swiper {...props} history={_history} />
    </HistoryContext.Provider>
  )
}

export default SwipeRouter

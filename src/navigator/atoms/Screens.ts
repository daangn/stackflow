import React from 'react'
import { atom } from 'recoil'

export interface Screen {
  id: string
  path: string
  Component: React.FC<{ screenInstanceId: string }>
}

/**
 * Screen 컴포넌트가 초기화될때 해당 컴포넌트에 대한 정보를 담습니다
 */
export const AtomScreens = atom<{
  [id: string]: Screen
}>({
  key: 'Screens',
  default: {},
})

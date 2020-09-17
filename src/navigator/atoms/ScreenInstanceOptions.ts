import React from 'react'
import { atom } from 'recoil'

export interface NavbarOptions {
  visible: boolean
  title: React.ReactNode | null
  left: React.ReactNode | null
  right: React.ReactNode | null
  back: React.ReactNode | null
}

export const AtomScreenInstanceOptions = atom<{
  [screenInstanceId: string]: {
    navbar: NavbarOptions
  }
}>({
  key: 'KFScreenInstanceOptions',
  default: {},
})

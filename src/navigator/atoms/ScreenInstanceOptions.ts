import React from 'react'
import { atom } from 'recoil'

export interface NavbarOptions {
  visible: boolean
  title: React.ReactNode | null
  appendLeft: React.ReactNode | null
  appendRight: React.ReactNode | null
  customBackButton: React.ReactNode | null
  customCloseButton: React.ReactNode | null
}

export const AtomScreenInstanceOptions = atom<{
  [screenInstanceId: string]: {
    navbar: NavbarOptions
  }
}>({
  key: 'KFScreenInstanceOptions',
  default: {},
})

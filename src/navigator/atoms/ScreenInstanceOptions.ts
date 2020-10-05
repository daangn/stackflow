import React from 'react'
import { atom } from 'recoil'

export interface NavbarOptions {
  visible: boolean
  title: React.ReactNode | null
  appendLeft: React.ReactNode | null
  appendRight: React.ReactNode | null
  closeButtonLocation: 'left' | 'right'
  customBackButton: React.ReactNode | null
  customCloseButton: React.ReactNode | null
}

export interface FixedOptions {
  top: {
    node: React.ReactNode
    style: React.CSSProperties
  } | null
  bottom: {
    node: React.ReactNode
    style: React.CSSProperties
  } | null
}

export const AtomScreenInstanceOptions = atom<{
  [screenInstanceId: string]: {
    navbar: NavbarOptions
    fixed: FixedOptions
  }
}>({
  key: 'KFScreenInstanceOptions',
  default: {},
})

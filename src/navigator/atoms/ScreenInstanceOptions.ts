import { atom } from 'recoil'

export interface NavbarOptions {
  title: string
  visible: boolean
  left: React.ReactNode | null
  right: React.ReactNode | null
  center: React.ReactNode | null
}

export const AtomScreenInstanceOptions = atom<{
  [screenInstanceId: string]: {
    navbar: NavbarOptions
  }
}>({
  key: 'ScreenInstanceOptions',
  default: {},
})

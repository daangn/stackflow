import { atom } from 'recoil'

export interface ScreenInstance {
  id: string
  screenId: string
  navbar: NavbarOptions
}
export interface NavbarOptions {
  title: string
  visible: boolean
  left: React.ReactNode | null
  right: React.ReactNode | null
  center: React.ReactNode | null
}

export const AtomScreenInstances = atom<ScreenInstance[]>({
  key: 'ScreenInstances',
  default: [],
})

import { atom } from 'recoil'

export interface NavbarOptions {
  title: string
}

interface ScreenInstance {
  id: string
  screenId: string
  navbar: NavbarOptions
}

export const AtomScreenInstances = atom<ScreenInstance[]>({
  key: 'ScreenInstances',
  default: [],
})

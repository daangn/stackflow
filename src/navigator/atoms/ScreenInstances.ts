import { atom } from 'recoil'

interface ScreenInstance {
  id: string
  screenId: string
  navbar: NavbarOptions
}
export interface NavbarOptions {
  title: string
  visible: boolean
}

export const AtomScreenInstances = atom<ScreenInstance[]>({
  key: 'ScreenInstances',
  default: [],
})

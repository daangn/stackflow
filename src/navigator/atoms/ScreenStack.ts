import { atom } from 'recoil'

interface ScreenStackItem {
  id: string
  screenId: string
}

export const AtomScreenStack = atom<ScreenStackItem[]>({
  key: 'ScreenStack',
  default: [],
})

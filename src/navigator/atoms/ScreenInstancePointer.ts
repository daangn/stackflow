import { atom } from 'recoil'

export const AtomScreenInstancePointer = atom<number>({
  key: 'ScreenInstancePointer',
  default: -1,
})

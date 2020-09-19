import { atom } from 'recoil'

export const AtomScreenInstancePointer = atom<number>({
  key: 'KFScreenInstancePointer',
  default: -1,
})

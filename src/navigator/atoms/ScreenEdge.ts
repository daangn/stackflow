import { atom } from 'recoil'

export const AtomScreenEdge = atom<{
  startX: number | null
  startTime: number | null
}>({
  key: 'KFScreenEdge',
  default: {
    startX: null,
    startTime: null,
  },
})

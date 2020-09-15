import { atom } from 'recoil'

export const AtomScreenEdge = atom<{
  startX: number | null
  startTime: number | null
  x: number
}>({
  key: 'ScreenEdge',
  default: {
    startX: null,
    startTime: null,
    x: 0,
  },
})

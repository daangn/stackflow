import { atom } from 'recoil'

export const AtomScreenEdge = atom<{
  edgeStartX: number | null
  edgeStartTime: number | null
  edgeX: number
}>({
  key: 'ScreenEdge',
  default: {
    edgeStartX: null,
    edgeStartTime: null,
    edgeX: 0,
  },
})
